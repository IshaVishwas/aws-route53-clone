"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Filter,
  AlertCircle,
  AlertTriangle,
  Server,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import { Table, Column } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  HostedZone,
  DNSRecord,
  DNSRecordType,
} from "@/lib/types";
import {
  getHostedZone,
  listRecordsForZone,
  createRecordForZone,
  updateRecord,
  deleteRecord,
} from "@/lib/api";

const ALL_RECORD_TYPES: DNSRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
];

const RECORD_PLACEHOLDERS: Record<DNSRecordType, string> = {
  A: "192.0.2.1",
  AAAA: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
  CNAME: "lb.example.com.",
  TXT: '"v=spf1 include:_spf.google.com ~all"',
  MX: "mail.example.com.",
  NS: "ns-1.awsdns.org.",
  PTR: "host.example.com.",
  SRV: "0 5060 sipserver.example.com.",
  CAA: '0 issue "amazon.com"',
};

export default function HostedZoneDetailPage() {
  const params = useParams();
  const { showToast } = useToast();

  const zoneId = typeof params.zoneId === "string" ? params.zoneId : "";

  // Zone metadata state
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [isZoneLoading, setIsZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);

  // Records data state
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Target item for edit/delete
  const [activeRecord, setActiveRecord] = useState<DNSRecord | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<DNSRecordType>("A");
  const [createTtl, setCreateTtl] = useState(300);
  const [createValue, setCreateValue] = useState("");
  const [createPriority, setCreatePriority] = useState<number | undefined>(10);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editTtl, setEditTtl] = useState(300);
  const [editValue, setEditValue] = useState("");
  const [editPriority, setEditPriority] = useState<number | undefined>(undefined);
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch Hosted Zone Metadata
  // ---------------------------------------------------------------------------
  const fetchZone = useCallback(() => {
    if (!zoneId) return;
    setIsZoneLoading(true);
    setZoneError(null);
    getHostedZone(zoneId)
      .then((data) => {
        setZone(data);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load hosted zone.";
        setZoneError(msg);
      })
      .finally(() => {
        setIsZoneLoading(false);
      });
  }, [zoneId]);

  // Initial load of Zone metadata
  useEffect(() => {
    let cancelled = false;
    if (!zoneId) return;

    getHostedZone(zoneId)
      .then((data) => {
        if (!cancelled) {
          setZone(data);
          setZoneError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setZoneError(
            err instanceof Error ? err.message : "Failed to load zone."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsZoneLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [zoneId]);

  // ---------------------------------------------------------------------------
  // Fetch Records
  // ---------------------------------------------------------------------------
  const refreshRecords = useCallback(() => {
    if (!zoneId) return;
    setIsRecordsLoading(true);
    setRecordsError(null);

    listRecordsForZone(zoneId, {
      search: searchQuery,
      type: typeFilter,
      page: currentPage,
      page_size: pageSize,
    })
      .then((response) => {
        setRecords(response.items);
        setTotalRecords(response.total);
        setTotalPages(response.total_pages);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load DNS records.";
        setRecordsError(msg);
        showToast({
          type: "error",
          title: "Network error",
          message: msg,
        });
      })
      .finally(() => {
        setIsRecordsLoading(false);
      });
  }, [zoneId, searchQuery, typeFilter, currentPage, pageSize, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshRecords();
  }, [refreshRecords]);

  // Helpers
  const singleSelectedRecord = useMemo(() => {
    if (selectedIds.length === 1) {
      return records.find((r) => r.id === selectedIds[0]) || null;
    }
    return null;
  }, [selectedIds, records]);

  // Selection handlers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === records.length && records.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  // ---------------------------------------------------------------------------
  // Create Record Handlers
  // ---------------------------------------------------------------------------
  const openCreateModal = () => {
    setCreateName("");
    setCreateType("A");
    setCreateTtl(300);
    setCreateValue("");
    setCreatePriority(10);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmedName = createName.trim().toLowerCase();
    if (!trimmedName) {
      setCreateError("Record name is required.");
      return;
    }

    const trimmedValue = createValue.trim();
    if (!trimmedValue) {
      setCreateError("Record value is required.");
      return;
    }

    setIsCreating(true);
    try {
      await createRecordForZone(zoneId, {
        name: trimmedName,
        type: createType,
        ttl: createTtl,
        value: trimmedValue,
        priority:
          createType === "MX" || createType === "SRV"
            ? createPriority
            : undefined,
      });

      showToast({
        type: "success",
        title: "DNS record created",
        message: `Successfully created ${createType} record for '${trimmedName}'.`,
      });

      setIsCreateModalOpen(false);
      refreshRecords();
      fetchZone();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create DNS record.";
      setCreateError(msg);
      showToast({
        type: "error",
        title: "Creation failed",
        message: msg,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Edit Record Handlers
  // ---------------------------------------------------------------------------
  const openEditModal = (rec: DNSRecord) => {
    setActiveRecord(rec);
    setEditName(rec.name);
    setEditTtl(rec.ttl);
    setEditValue(rec.value);
    setEditPriority(rec.priority ?? undefined);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;

    setEditError(null);
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      setEditError("Record value is required.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateRecord(activeRecord.id, {
        name: editName.trim().toLowerCase(),
        ttl: editTtl,
        value: trimmedValue,
        priority:
          activeRecord.type === "MX" || activeRecord.type === "SRV"
            ? editPriority
            : undefined,
      });

      showToast({
        type: "success",
        title: "DNS record updated",
        message: `Successfully updated ${activeRecord.type} record for '${activeRecord.name}'.`,
      });

      setIsEditModalOpen(false);
      setActiveRecord(null);
      refreshRecords();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update DNS record.";
      setEditError(msg);
      showToast({
        type: "error",
        title: "Update failed",
        message: msg,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Record Handlers
  // ---------------------------------------------------------------------------
  const openDeleteModal = (rec?: DNSRecord) => {
    if (rec) {
      setActiveRecord(rec);
    } else if (singleSelectedRecord) {
      setActiveRecord(singleSelectedRecord);
    }
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (activeRecord) {
        await deleteRecord(activeRecord.id);
        showToast({
          type: "success",
          title: "DNS record deleted",
          message: `Successfully deleted ${activeRecord.type} record '${activeRecord.name}'.`,
        });
      } else if (selectedIds.length > 0) {
        for (const id of selectedIds) {
          await deleteRecord(id);
        }
        showToast({
          type: "success",
          title: "Records deleted",
          message: `Successfully deleted ${selectedIds.length} DNS record${selectedIds.length === 1 ? "" : "s"}.`,
        });
      }

      setIsDeleteModalOpen(false);
      setActiveRecord(null);
      setSelectedIds([]);
      refreshRecords();
      fetchZone();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete record.";
      setDeleteError(msg);
      showToast({
        type: "error",
        title: "Deletion failed",
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Badge Color Helper for DNS Record Types
  // ---------------------------------------------------------------------------
  const getTypeBadgeVariant = (type: DNSRecordType): "info" | "success" | "warning" | "neutral" => {
    switch (type) {
      case "A":
      case "AAAA":
        return "info";
      case "NS":
        return "success";
      case "MX":
      case "SRV":
        return "warning";
      case "CNAME":
      case "TXT":
      case "PTR":
      case "CAA":
      default:
        return "neutral";
    }
  };

  // ---------------------------------------------------------------------------
  // Columns Definition
  // ---------------------------------------------------------------------------
  const columns: Column<DNSRecord>[] = [
    {
      key: "name",
      header: "Record name",
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-white text-xs">
          {row.name}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "110px",
      render: (row) => (
        <Badge variant={getTypeBadgeVariant(row.type)} size="sm">
          {row.type}
        </Badge>
      ),
    },
    {
      key: "ttl",
      header: "TTL (Seconds)",
      width: "120px",
      align: "center",
      render: (row) => (
        <span className="font-mono text-gray-300 text-xs">{row.ttl}</span>
      ),
    },
    {
      key: "value",
      header: "Value / Route traffic to",
      render: (row) => (
        <div className="flex items-center space-x-2 truncate max-w-md">
          {row.priority !== null && row.priority !== undefined && (
            <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
              Priority: {row.priority}
            </span>
          )}
          <span className="font-mono text-xs text-gray-200 truncate" title={row.value}>
            {row.value}
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created date",
      width: "140px",
      render: (row) => (
        <span className="text-gray-400 font-mono text-[11px]">
          {new Date(row.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "90px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            title="Edit record"
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1e293b] transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(row);
            }}
            title="Delete record"
            className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // If Zone Not Found / Failed Load
  // ---------------------------------------------------------------------------
  if (!isZoneLoading && zoneError) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <PageHeader
          title="Hosted zone not found"
          breadcrumbs={[
            { label: "Hosted zones", href: "/hosted-zones" },
            { label: "Not found" },
          ]}
        />
        <div className="p-6 bg-[#161e2e] border border-red-800/60 rounded-lg shadow-2xs space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <div>
            <h2 className="text-base font-bold text-white">
              Unable to locate hosted zone
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              The hosted zone ID &quot;{zoneId}&quot; could not be found. It may have been deleted or the identifier is invalid.
            </p>
          </div>
          <Link href="/hosted-zones">
            <Button variant="primary" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Hosted Zones
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <PageHeader
        title={zone ? zone.name : "Hosted zone records"}
        description={
          zone?.comment ||
          "Manage DNS records for this hosted zone to control domain routing and services."
        }
        breadcrumbs={[
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: zone ? zone.name : "Records" },
        ]}
        infoLink={{
          text: "DNS Records Guide",
          href: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/rrsets-working-with.html",
        }}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/hosted-zones">
              <Button
                variant="secondary"
                size="md"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to zones
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isRecordsLoading ? "animate-spin" : ""}`} />}
              onClick={refreshRecords}
              disabled={isRecordsLoading}
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={selectedIds.length !== 1}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (singleSelectedRecord) openEditModal(singleSelectedRecord);
              }}
            >
              Edit
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={selectedIds.length === 0}
              icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
              onClick={() => openDeleteModal()}
            >
              Delete
            </Button>

            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={openCreateModal}
            >
              Create record
            </Button>
          </div>
        }
      />

      {/* Hosted Zone Metadata Bar (AWS Console Summary Card) */}
      {zone && (
        <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-4 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Hosted Zone ID
            </span>
            <span className="font-mono font-semibold text-white bg-[#0f172a] px-1.5 py-0.5 rounded border border-[#3b4b5e]">
              {zone.zone_id}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Zone Type
            </span>
            <Badge
              variant={zone.type === "PUBLIC" ? "info" : "neutral"}
              size="sm"
              dot
            >
              {zone.type === "PUBLIC" ? "Public zone" : "Private zone"}
            </Badge>
          </div>

          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Record Count
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {totalRecords} {totalRecords === 1 ? "record" : "records"}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
              Description
            </span>
            <span className="text-gray-300 truncate block">
              {zone.comment || "None provided"}
            </span>
          </div>
        </div>
      )}

      {/* API Error Notification */}
      {recordsError && (
        <div
          role="alert"
          className="p-3.5 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-200 flex items-start justify-between space-x-3 shadow-2xs"
        >
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Failed to load DNS records</p>
              <p className="mt-0.5 text-red-300">{recordsError}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshRecords}
            className="shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar Container */}
      <div className="bg-[#161e2e] border border-[#2e384d] rounded-t p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center space-x-3 max-w-lg">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search records by name or value..."
            className="flex-1"
          />

          <div className="flex items-center space-x-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by DNS record type"
              className="bg-[#0f172a] border border-[#3b4b5e] rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-[#539fe5]"
            >
              <option value="ALL">All record types</option>
              {ALL_RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t} record
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-400 self-center sm:self-auto font-mono flex items-center space-x-2">
          {(searchQuery || typeFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("ALL");
                setCurrentPage(1);
              }}
              className="text-[#539fe5] hover:text-[#8cbcf5] hover:underline cursor-pointer mr-2 text-xs font-sans transition-colors"
            >
              Clear filters
            </button>
          )}
          <span>
            {selectedIds.length > 0
              ? `${selectedIds.length} of ${totalRecords} selected`
              : `${totalRecords} total ${totalRecords === 1 ? "record" : "records"}`}
          </span>
        </div>
      </div>

      {/* Records Table */}
      <div className="-mt-5">
        <Table<DNSRecord>
          columns={columns}
          data={records}
          keyField="id"
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isLoading={isRecordsLoading}
          emptyState={
            searchQuery || typeFilter !== "ALL" ? (
              <EmptyState
                icon={Filter}
                title="No matching DNS records"
                description={`No records match your filter "${searchQuery}". Try searching for another name or clearing the filter.`}
                actionLabel="Clear filters"
                onAction={() => {
                  setSearchQuery("");
                  setTypeFilter("ALL");
                  setCurrentPage(1);
                }}
              />
            ) : (
              <EmptyState
                icon={Server}
                title="No DNS records configured"
                description="This hosted zone does not have any DNS records yet. Create your first record (such as an A, CNAME, or MX record) to start routing domain traffic."
                actionLabel="Create record"
                onAction={openCreateModal}
              />
            )
          }
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemName="records"
        />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 1. CREATE RECORD MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create record"
        description="Add a DNS record to configure routing behavior for your domain."
        maxWidth="lg"
        footerActions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={isCreating}
            >
              Create record
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div
              role="alert"
              className="p-3 bg-red-950/70 border border-red-800 rounded text-xs text-red-200 flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Validation error</p>
                <p className="mt-0.5 text-red-300">{createError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="createRecordName"
                className="block font-bold text-gray-200 text-xs mb-1"
              >
                Record name <span className="text-red-400">*</span>
              </label>
              <input
                id="createRecordName"
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. www.example.com"
                required
                className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5] font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Enter the subdomain or apex domain. Trailing dot will be added automatically.
              </p>
            </div>

            <div>
              <label
                htmlFor="createRecordType"
                className="block font-bold text-gray-200 text-xs mb-1"
              >
                Record type <span className="text-red-400">*</span>
              </label>
              <select
                id="createRecordType"
                value={createType}
                onChange={(e) => {
                  const newType = e.target.value as DNSRecordType;
                  setCreateType(newType);
                  if (newType === "MX" && !createPriority) {
                    setCreatePriority(10);
                  }
                }}
                className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-semibold"
              >
                {ALL_RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} - {getRecordTypeDescription(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="createRecordTtl"
                className="block font-bold text-gray-200 text-xs mb-1"
              >
                TTL (Seconds) <span className="text-red-400">*</span>
              </label>
              <input
                id="createRecordTtl"
                type="number"
                min={1}
                max={2147483647}
                value={createTtl}
                onChange={(e) => setCreateTtl(Number(e.target.value))}
                required
                className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                300 seconds (5 minutes) is the standard default.
              </p>
            </div>

            {(createType === "MX" || createType === "SRV") && (
              <div>
                <label
                  htmlFor="createRecordPriority"
                  className="block font-bold text-gray-200 text-xs mb-1"
                >
                  Priority <span className="text-red-400">*</span>
                </label>
                <input
                  id="createRecordPriority"
                  type="number"
                  min={0}
                  max={65535}
                  value={createPriority ?? 10}
                  onChange={(e) => setCreatePriority(Number(e.target.value))}
                  required
                  className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Lower numbers have higher delivery priority (e.g. 10).
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="createRecordValue"
              className="block font-bold text-gray-200 text-xs mb-1"
            >
              Value / Route traffic to <span className="text-red-400">*</span>
            </label>
            <textarea
              id="createRecordValue"
              rows={3}
              value={createValue}
              onChange={(e) => setCreateValue(e.target.value)}
              placeholder={`e.g. ${RECORD_PLACEHOLDERS[createType]}`}
              required
              className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Enter target value according to record type ({createType}).
            </p>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* 2. EDIT RECORD MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveRecord(null);
        }}
        title="Edit DNS record"
        description="Update routing configuration and TTL values."
        maxWidth="lg"
        footerActions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setActiveRecord(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSubmit}
              isLoading={isUpdating}
            >
              Save changes
            </Button>
          </div>
        }
      >
        {activeRecord && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div
                role="alert"
                className="p-3 bg-red-950/70 border border-red-800 rounded text-xs text-red-200 flex items-start space-x-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Update error</p>
                  <p className="mt-0.5 text-red-300">{editError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="editRecordName"
                  className="block font-bold text-gray-200 text-xs mb-1"
                >
                  Record name <span className="text-red-400">*</span>
                </label>
                <input
                  id="editRecordName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-200 text-xs mb-1">
                  Record type
                </label>
                <input
                  type="text"
                  value={activeRecord.type}
                  disabled
                  className="w-full text-xs p-2 border border-[#2e384d] rounded bg-[#1e293b] text-gray-400 font-mono font-semibold cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Type cannot be modified directly per Route 53 immutability rules.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="editRecordTtl"
                  className="block font-bold text-gray-200 text-xs mb-1"
                >
                  TTL (Seconds) <span className="text-red-400">*</span>
                </label>
                <input
                  id="editRecordTtl"
                  type="number"
                  min={1}
                  max={2147483647}
                  value={editTtl}
                  onChange={(e) => setEditTtl(Number(e.target.value))}
                  required
                  className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-mono"
                />
              </div>

              {(activeRecord.type === "MX" || activeRecord.type === "SRV") && (
                <div>
                  <label
                    htmlFor="editRecordPriority"
                    className="block font-bold text-gray-200 text-xs mb-1"
                  >
                    Priority
                  </label>
                  <input
                    id="editRecordPriority"
                    type="number"
                    min={0}
                    max={65535}
                    value={editPriority ?? 10}
                    onChange={(e) => setEditPriority(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-mono"
                  />
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="editRecordValue"
                className="block font-bold text-gray-200 text-xs mb-1"
              >
                Value / Route traffic to <span className="text-red-400">*</span>
              </label>
              <textarea
                id="editRecordValue"
                rows={3}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                required
                className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white focus:outline-none focus:border-[#539fe5] font-mono"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* 3. DELETE RECORD CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveRecord(null);
        }}
        title="Delete DNS record"
        description="Permanently remove DNS routing for this record."
        maxWidth="md"
        footerActions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setActiveRecord(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {deleteError && (
            <div
              role="alert"
              className="p-3 bg-red-950/70 border border-red-800 rounded text-xs text-red-200 flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Deletion failed</p>
                <p className="mt-0.5 text-red-300">{deleteError}</p>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white">
                Are you sure you want to delete this DNS record?
              </p>
              <div className="text-gray-300 leading-relaxed font-mono">
                {activeRecord ? (
                  <>
                    <span className="font-bold text-white">{activeRecord.name}</span>{" "}
                    ({activeRecord.type} &rarr; {activeRecord.value})
                  </>
                ) : (
                  <>
                    You are about to delete <span className="font-bold text-white">{selectedIds.length}</span> record(s).
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            This action cannot be undone. Route 53 will immediately cease responding to queries matching this DNS record.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function getRecordTypeDescription(type: DNSRecordType): string {
  switch (type) {
    case "A":
      return "Routes traffic to IPv4 address";
    case "AAAA":
      return "Routes traffic to IPv6 address";
    case "CNAME":
      return "Canonical name / alias to domain";
    case "TXT":
      return "Text verification / SPF / DKIM";
    case "MX":
      return "Mail exchange server";
    case "NS":
      return "Name server delegation";
    case "PTR":
      return "Pointer / reverse DNS";
    case "SRV":
      return "Service locator";
    case "CAA":
      return "Certificate Authority Authorization";
    default:
      return "";
  }
}
