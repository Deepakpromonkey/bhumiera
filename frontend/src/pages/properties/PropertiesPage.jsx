"use client";
import { useState, useCallback } from "react";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PropertyTable } from "@/components/property/PropertyTable";
import { PropertyForm } from "@/components/property/PropertyForm";
import { toast }         from "@/components/ui/Toast";
import { apiFetch }      from "@/lib/api";
import { useApi }        from "@/hooks/useApi";

const NAVY = "#1a2d4a";
const GOLD = "#c9a84c";

export default function PropertiesPage() {
    const [page,       setPage]       = useState(1);
    const [modalOpen,  setModalOpen]  = useState(false);
    const [editTarget, setEditTarget] = useState(null); 

    const { data: apiResponse, loading, error, refetch } = useApi(
        `/api/properties?page=${page}&limit=10`,
        "data"
    );

    const [rawData,      setRawData]      = useState([]);
    const [pagination,   setPagination]   = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

    const loadProperties = useCallback(async (p = 1) => {
        setFetchLoading(true);
        try {
            const json = await apiFetch(`/api/properties?page=${p}&limit=10`);
            setRawData(json?.data ?? []);
            setPagination({
                page:       json?.currentPage  ?? p,
                limit:      json?.perPage       ?? 10,
                total:      json?.total         ?? 0,
                totalPages: json?.totalPages    ?? 1,
                hasNextPage: json?.hasNextPage  ?? false,
                hasPrevPage: json?.hasPrevPage  ?? false,
            });
        } catch (e) {
            toast.error({ title: "Failed to load", message: e.message });
        } finally {
            setFetchLoading(false);
        }
    }, []);

    useState(() => { loadProperties(page); }, [page]);

    function handlePageChange(newPage) {
        setPage(newPage);
        loadProperties(newPage);
    }

    function openCreate() { setEditTarget(null); setModalOpen(true); }
    function openEdit(p)  { setEditTarget(p);    setModalOpen(true); }
    function closeModal() { setModalOpen(false); setEditTarget(null); }

    async function handleSave(formData) {
        const isEdit = !!editTarget;
        const path   = isEdit
            ? `/api/properties/${editTarget._id}`
            : `/api/properties`;
        const method = isEdit ? "PUT" : "POST";

        await apiFetch(path, { method, body: formData });

        toast.success({
            title:   isEdit ? "Property updated" : "Property created",
            message: isEdit
                ? "Changes saved successfully."
                : "New property added to the portfolio.",
        });

        closeModal();
        loadProperties(page);
    }

    async function handleDelete(property) {
        await apiFetch(`/api/properties/${property._id}`, { method: "DELETE" });
        toast.success({
            title:   "Property deleted",
            message: `"${property.propertyName}" has been removed.`,
        });
        loadProperties(page);
    }

    return (
        <div className="min-h-full space-y-5">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1"
                         style={{ color: "#9a8e7a" }}>
                        <span>Admin Portal</span>
                        <ChevronRight size={11} />
                        <span style={{ color: NAVY, fontWeight: 600 }}>Property Management</span>
                    </div>
                    <h1
                        className="text-2xl font-bold leading-tight"
                        style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                    >
                        Property Management
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "#9a8e7a" }}>
                        Manage your institutional land portfolio — add, edit, and track properties.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: GOLD, color: "#1a2d4a" }}
                >
                    <Plus size={15} strokeWidth={2.5} />
                    New Property
                </button>
            </div>

            {/* ── Stats strip ── */}
            {pagination && (
                <div className="flex items-center gap-6 px-5 py-3 bg-white border border-[#e8e2d8] rounded-xl">
                    {[
                        { label: "Total Properties", value: pagination.total },
                        { label: "This Page",        value: rawData.length   },
                        { label: "Page",             value: `${pagination.page} / ${pagination.totalPages}` },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-wider uppercase"
                                  style={{ color: "#9a8e7a" }}>
                                {s.label}
                            </span>
                            <span className="text-lg font-bold mt-0.5" style={{ color: NAVY }}>
                                {s.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Table ── */}
            {fetchLoading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: `${GOLD} transparent ${GOLD} ${GOLD}` }}
                        />
                        <p className="text-sm font-medium" style={{ color: "#9a8e7a" }}>
                            Loading properties...
                        </p>
                    </div>
                </div>
            ) : (
                <PropertyTable
                    data={rawData}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* ── Add / Edit modal ── */}
            <Dialog open={modalOpen} onOpenChange={o => { if (!o) closeModal(); }}>
                <DialogContent
                    className="max-w-5xl w-full rounded-2xl bg-[#f5f2ed] p-0 overflow-hidden"
                    style={{ maxHeight: "92vh", overflowY: "auto", width: "80%", maxWidth: "100%", }}
                >
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e8e2d8] bg-white sticky top-0 z-10">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1"
                             style={{ color: "#9a8e7a" }}>
                            <span>Admin Portal</span>
                            <ChevronRight size={11} />
                            <span>Property Management</span>
                            <ChevronRight size={11} />
                            <span style={{ color: NAVY, fontWeight: 600 }}>
                                {editTarget ? "Edit Property" : "New Intake"}
                            </span>
                        </div>
                        <DialogTitle
                            className="text-xl font-bold"
                            style={{ color: NAVY, fontFamily: "Georgia, serif" }}
                        >
                            {editTarget ? `Edit: ${editTarget.propertyName}` : "New Property Intake"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6">
                        <PropertyForm
                            defaultValues={editTarget}
                            onSave={handleSave}
                            onCancel={closeModal}
                        />
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}