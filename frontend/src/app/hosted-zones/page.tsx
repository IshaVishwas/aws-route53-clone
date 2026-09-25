"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  Filter,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Globe,
  AlertCircle,
  ExternalLink,
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
import { HostedZone } from "@/lib/types";
import {
  listHostedZones,
  createHostedZone,
  updateHostedZone,
  deleteHostedZone,
} from "@/lib/api";

export default function HostedZonesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Data state
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Modal target items & form inputs
  const [activeZone, setActiveZone] = useState<HostedZone | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [createComment, setCreateComment] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Form State
  const [editComment, setEditComment] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch / Refresh Data
  // ---------------------------------------------------------------------------
  const refreshData = useCallback(() => {
    setIsLoading(true);
    setApiError(null);
    listHostedZones({
      search: searchQuery,
      type: typeFilter,
      page: currentPage,
      page_size: pageSize,
    })
      .then((response) => {
        setZones(response.items);
        setTotalItems(response.total);
        setTotalPages(response.total_pages);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load hosted zones.";
        setApiError(msg);
        showToast({
          type: "error",
          title: "Network error",
          message: msg,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, typeFilter, currentPage, pageSize, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshData();
  }, [refreshData]);

  // Selected item helpers
  const singleSelectedZone = useMemo(() => {
    if (selectedIds.length === 1) {
      return zones.find((z) => z.id === selectedIds[0]) || null;
    }
    return null;
  }, [selectedIds, zones]);

  // Selection handlers
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === zones.length && zones.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(zones.map((z) => z.id));
    }
  };

  // ---------------------------------------------------------------------------
  // Create Modal Handlers
  // ---------------------------------------------------------------------------
  const openCreateModal = () => {
    setCreateName("");
    setCreateType("PUBLIC");
    setCreateComment("");
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmed = createName.trim().toLowerCase();
    if (!trimmed) {
      setCreateError("Domain name is required.");
      return;
    }

    // FQDN validation check before dispatching
    const checkDomain = trimmed.replace(/\.+$/, "");
    const fqdnPattern = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z0-9\-]{2,}$/;
    if (!fqdnPattern.test(checkDomain)) {
      setCreateError(
        "Invalid domain name format. Please enter a valid FQDN such as 'example.com' or 'sub.domain.org'."
      );
      return;
    }

    setIsCreating(true);
    try {
      const newZone = await createHostedZone({
        name: trimmed,
        type: createType,
        comment: createComment.trim() || undefined,
        private_zone: createType === "PRIVATE",
      });

      showToast({
        type: "success",
        title: "Hosted zone created",
        message: `Successfully created hosted zone for '${newZone.name}' (${newZone.zone_id}).`,
      });

      setIsCreateModalOpen(false);
      refreshData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create hosted zone.";
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
  // Edit Modal Handlers
  // ---------------------------------------------------------------------------
  const openEditModal = (zone: HostedZone) => {
    setActiveZone(zone);
    setEditComment(zone.comment || "");
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeZone) return;

    setIsUpdating(true);
    setEditError(null);
    try {
      await updateHostedZone(activeZone.zone_id, {
        comment: editComment.trim() || undefined,
      });

      showToast({
        type: "success",
        title: "Hosted zone updated",
        message: `Successfully updated description for '${activeZone.name}'.`,
      });

      setIsEditModalOpen(false);
      setActiveZone(null);
      refreshData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update hosted zone.";
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
  // Delete Modal Handlers
  // ---------------------------------------------------------------------------
  const openDeleteModal = (zone?: HostedZone) => {
    if (zone) {
      setActiveZone(zone);
    } else if (singleSelectedZone) {
      setActiveZone(singleSelectedZone);
    }
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (activeZone) {
        await deleteHostedZone(activeZone.zone_id);
        showToast({
          type: "success",
          title: "Hosted zone deleted",
          message: `Successfully deleted hosted zone '${activeZone.name}'.`,
        });
      } else if (selectedIds.length > 0) {
        for (const id of selectedIds) {
          const zoneObj = zones.find((z) => z.id === id);
          if (zoneObj) {
            await deleteHostedZone(zoneObj.zone_id);
          }
        }
        showToast({
          type: "success",
          title: "Hosted zones deleted",
          message: `Successfully deleted ${selectedIds.length} hosted zone${selectedIds.length === 1 ? "" : "s"}.`,
        });
      }

      setIsDeleteModalOpen(false);
      setActiveZone(null);
      setSelectedIds([]);
      refreshData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete hosted zone.";
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
  // Details Modal Handlers
  // ---------------------------------------------------------------------------
  const openDetailsModal = (zone: HostedZone) => {
    setActiveZone(zone);
    setIsDetailsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Columns Definition
  // ---------------------------------------------------------------------------
  const columns: Column<HostedZone>[] = [
    {
      key: "name",
      header: "Hosted zone name",
      sortable: true,
      render: (row) => (
        <Link
          href={`/hosted-zones/${row.id}`}
          className="font-semibold text-[#539fe5] hover:text-[#8cbcf5] hover:underline cursor-pointer flex items-center space-x-1.5 text-left transition-colors"
        >
          <span>{row.name}</span>
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "140px",
      render: (row) => (
        <Badge
          variant={row.type === "PUBLIC" ? "info" : "neutral"}
          size="sm"
          dot
        >
          {row.type === "PUBLIC" ? "Public zone" : "Private zone"}
        </Badge>
      ),
    },
    {
      key: "zone_id",
      header: "Hosted zone ID",
      width: "160px",
      render: (row) => (
        <span className="font-mono text-gray-300 text-xs bg-[#0f172a] px-1.5 py-0.5 rounded border border-[#3b4b5e]">
          {row.zone_id}
        </span>
      ),
    },
    {
      key: "comment",
      header: "Description",
      render: (row) => (
        <span className="text-gray-400 truncate max-w-xs block text-xs">
          {row.comment || "-"}
        </span>
      ),
    },
    {
      key: "record_count",
      header: "Record count",
      width: "110px",
      align: "center",
      render: (row) => (
        <span className="font-mono text-white font-semibold">
          {row.record_count}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created date",
      width: "150px",
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
      width: "120px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end space-x-1">
          <Link
            href={`/hosted-zones/${row.id}`}
            title="Manage DNS records"
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1e293b] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            title="Edit description"
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
            title="Delete hosted zone"
            className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Hosted zones"
        description="A hosted zone is a container for records, and records contain information about how you want to route traffic for a domain (such as example.com) and its subdomains."
        breadcrumbs={[{ label: "Hosted zones" }]}
        infoLink={{
          text: "Info",
          href: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-working-with.html",
        }}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
              onClick={refreshData}
              disabled={isLoading}
              title="Refresh hosted zones list"
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={selectedIds.length !== 1}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => {
                if (singleSelectedZone) {
                  router.push(`/hosted-zones/${singleSelectedZone.id}`);
                }
              }}
            >
              Manage records
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={selectedIds.length !== 1}
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => {
                if (singleSelectedZone) openDetailsModal(singleSelectedZone);
              }}
            >
              View details
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={selectedIds.length !== 1}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                if (singleSelectedZone) openEditModal(singleSelectedZone);
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
              Create hosted zone
            </Button>
          </div>
        }
      />

      {/* API Error Notification */}
      {apiError && (
        <div
          role="alert"
          className="p-3.5 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-200 flex items-start justify-between space-x-3 shadow-2xs"
        >
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Failed to load hosted zones</p>
              <p className="mt-0.5 text-red-300">{apiError}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshData}
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
            placeholder="Filter hosted zones by domain name..."
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
              aria-label="Filter by hosted zone type"
              className="bg-[#0f172a] border border-[#3b4b5e] rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-[#539fe5]"
            >
              <option value="ALL">All types</option>
              <option value="PUBLIC">Public hosted zone</option>
              <option value="PRIVATE">Private hosted zone</option>
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
              ? `${selectedIds.length} of ${totalItems} selected`
              : `${totalItems} total hosted zone${totalItems === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {/* Table with Empty and Loading States */}
      <div className="-mt-5">
        <Table<HostedZone>
          columns={columns}
          data={zones}
          keyField="id"
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isLoading={isLoading}
          emptyState={
            searchQuery || typeFilter !== "ALL" ? (
              <EmptyState
                icon={Filter}
                title="No matching hosted zones"
                description={`No hosted zones match your filter "${searchQuery}". Try adjusting your keywords or clearing the filter.`}
                actionLabel="Clear filters"
                onAction={() => {
                  setSearchQuery("");
                  setTypeFilter("ALL");
                  setCurrentPage(1);
                }}
              />
            ) : (
              <EmptyState
                icon={Layers}
                title="No hosted zones"
                description="You do not have any hosted zones configured. Create a hosted zone to start managing DNS routing records for your domain."
                actionLabel="Create hosted zone"
                onAction={openCreateModal}
              />
            )
          }
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemName="hosted zones"
        />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 1. CREATE HOSTED ZONE MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create hosted zone"
        description="A hosted zone tells Route 53 how to respond to DNS queries for a domain."
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
              Create hosted zone
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
                <p className="font-bold text-white">Creation error</p>
                <p className="mt-0.5 text-red-300">{createError}</p>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="createDomainName"
              className="block font-bold text-gray-200 text-xs mb-1"
            >
              Domain name <span className="text-red-400">*</span>
            </label>
            <input
              id="createDomainName"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. example.com or app.internal"
              required
              className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Enter the fully qualified domain name (FQDN). A trailing dot will be added automatically per DNS standards.
            </p>
          </div>

          <div>
            <label
              htmlFor="createComment"
              className="block font-bold text-gray-200 text-xs mb-1"
            >
              Description - optional
            </label>
            <textarea
              id="createComment"
              rows={2}
              value={createComment}
              onChange={(e) => setCreateComment(e.target.value)}
              placeholder="e.g. Production web application domain"
              maxLength={1000}
              className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-200 text-xs mb-1">
              Type
            </label>
            <div className="space-y-2 mt-1">
              <label
                className={`flex items-start space-x-2.5 p-3 border rounded cursor-pointer transition-colors ${
                  createType === "PUBLIC"
                    ? "border-[#539fe5] bg-[#1e3a5f]/40 ring-1 ring-[#539fe5]"
                    : "border-[#3b4b5e] bg-[#0f172a] hover:bg-[#1e293b]"
                }`}
              >
                <input
                  type="radio"
                  name="zoneType"
                  value="PUBLIC"
                  checked={createType === "PUBLIC"}
                  onChange={() => setCreateType("PUBLIC")}
                  className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211] cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#539fe5]" />
                    Public hosted zone
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Determines how traffic is routed on the Internet. Accessible globally.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start space-x-2.5 p-3 border rounded cursor-pointer transition-colors ${
                  createType === "PRIVATE"
                    ? "border-[#539fe5] bg-[#1e3a5f]/40 ring-1 ring-[#539fe5]"
                    : "border-[#3b4b5e] bg-[#0f172a] hover:bg-[#1e293b]"
                }`}
              >
                <input
                  type="radio"
                  name="zoneType"
                  value="PRIVATE"
                  checked={createType === "PRIVATE"}
                  onChange={() => setCreateType("PRIVATE")}
                  className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211] cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Private hosted zone for Amazon VPC
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Determines how traffic is routed within one or more Virtual Private Clouds (VPCs).
                  </div>
                </div>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* 2. EDIT HOSTED ZONE MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveZone(null);
        }}
        title="Edit hosted zone details"
        description="Update description and comments for this hosted zone."
        maxWidth="md"
        footerActions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setActiveZone(null);
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
        {activeZone && (
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

            <div>
              <label className="block font-bold text-gray-200 text-xs mb-1">
                Hosted zone name
              </label>
              <input
                type="text"
                value={activeZone.name}
                disabled
                className="w-full text-xs p-2 border border-[#2e384d] rounded bg-[#1e293b] text-gray-400 cursor-not-allowed font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                AWS Route 53 does not allow renaming a hosted zone after creation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-200 text-xs mb-1">
                  Hosted zone ID
                </label>
                <input
                  type="text"
                  value={activeZone.zone_id}
                  disabled
                  className="w-full text-xs p-2 border border-[#2e384d] rounded bg-[#1e293b] text-gray-400 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-200 text-xs mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={activeZone.type === "PUBLIC" ? "Public zone" : "Private zone"}
                  disabled
                  className="w-full text-xs p-2 border border-[#2e384d] rounded bg-[#1e293b] text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="editComment"
                className="block font-bold text-gray-200 text-xs mb-1"
              >
                Description / Comment
              </label>
              <textarea
                id="editComment"
                rows={3}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Enter description or comment..."
                maxLength={1000}
                className="w-full text-xs p-2 border border-[#3b4b5e] rounded bg-[#0f172a] text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5]"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* 3. DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveZone(null);
        }}
        title="Delete hosted zone"
        description="Permanently remove hosted zone and its DNS routing configurations."
        maxWidth="md"
        footerActions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setActiveZone(null);
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
              Confirm delete
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
                <p className="font-bold text-white">Delete error</p>
                <p className="mt-0.5 text-red-300">{deleteError}</p>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded text-xs text-amber-200 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">This action cannot be undone.</p>
              <p className="mt-0.5 leading-relaxed">
                When you delete a hosted zone, Route 53 deletes all resource record sets in the zone. Queries for domain names in this hosted zone will no longer be answered by Route 53 name servers.
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-300 space-y-1">
            <p>
              You are about to delete:
            </p>
            {activeZone ? (
              <div className="p-2.5 bg-[#0f172a] rounded border border-[#2e384d] font-mono font-bold text-white text-xs">
                {activeZone.name}{" "}
                <span className="text-gray-400 font-normal">
                  ({activeZone.zone_id})
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-[#0f172a] rounded border border-[#2e384d] text-xs">
                <span className="font-bold text-white">
                  {selectedIds.length} hosted zone(s) selected
                </span>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* 4. ZONE DETAILS DRAWER / MODAL */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setActiveZone(null);
        }}
        title="Hosted zone details"
        description="Configuration and properties for this DNS zone."
        maxWidth="lg"
        footerActions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDetailsModalOpen(false);
                setActiveZone(null);
              }}
            >
              Close
            </Button>
            {activeZone && (
              <Button
                variant="primary"
                onClick={() => {
                  router.push(`/hosted-zones/${activeZone.id}`);
                }}
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Go to DNS records
              </Button>
            )}
          </div>
        }
      >
        {activeZone && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#0f172a] rounded-lg border border-[#2e384d]">
              <div>
                <span className="text-gray-400 block mb-0.5">Domain Name:</span>
                <span className="font-bold text-white font-mono text-sm">
                  {activeZone.name}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Hosted Zone ID:</span>
                <span className="font-mono text-white bg-[#1e293b] px-1.5 py-0.5 rounded border border-[#3b4b5e]">
                  {activeZone.zone_id}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Zone Type:</span>
                <Badge
                  variant={activeZone.type === "PUBLIC" ? "info" : "neutral"}
                  size="sm"
                  dot
                >
                  {activeZone.type === "PUBLIC"
                    ? "Public hosted zone"
                    : "Private hosted zone"}
                </Badge>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Record Count:</span>
                <span className="font-mono font-bold text-white">
                  {activeZone.record_count} records
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-gray-400 block mb-0.5">Description:</span>
                <span className="text-gray-200">
                  {activeZone.comment || "None provided"}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Created Date:</span>
                <span className="text-gray-300 font-mono">
                  {new Date(activeZone.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Last Updated:</span>
                <span className="text-gray-300 font-mono">
                  {new Date(activeZone.updated_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#1e3450]/40 border border-[#2563eb]/40 rounded text-blue-200 text-xs flex items-center justify-between">
              <span>Ready to configure name server delegations or records?</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  router.push(`/hosted-zones/${activeZone.id}`);
                }}
              >
                Manage DNS records
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
