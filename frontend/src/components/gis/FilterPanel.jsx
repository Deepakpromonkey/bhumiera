"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMPTY_FILTERS, activeFilterCount } from "@/lib/gis";

function Section({ title, children, defaultOpen = true, count = 0 }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[#e8e2d8] last:border-b-0">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#faf8f4] transition-colors"
            >
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "#9a8e7a" }}>
                    {title}
                    {count > 0 && (
                        <span
                            className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                            style={{ background: "#c9a84c", color: "#1a2d4a" }}
                        >
                            {count}
                        </span>
                    )}
                </span>
                <ChevronDown
                    size={13}
                    className={cn("transition-transform text-[#b8ab93]", open && "rotate-180")}
                />
            </button>
            {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
        </div>
    );
}

function CheckRow({ label, checked, onChange, swatch }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-3.5 h-3.5 rounded border-[#d4c9b0] accent-[#c9a84c] cursor-pointer"
            />
            {swatch && (
                <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/10"
                    style={{ background: swatch }}
                />
            )}
            <span
                className="text-[13px] leading-tight group-hover:text-[#1a2d4a] transition-colors truncate"
                style={{ color: checked ? "#1a2d4a" : "#6b6250" }}
            >
                {label}
            </span>
        </label>
    );
}

function RangeRow({ label, unit, minValue, maxValue, onMin, onMax }) {
    return (
        <div className="space-y-1.5">
            <span className="text-[11px] font-semibold" style={{ color: "#6b6250" }}>
                {label} {unit && <span className="font-normal text-[#b8ab93]">({unit})</span>}
            </span>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    placeholder="Min"
                    value={minValue}
                    onChange={(e) => onMin(e.target.value)}
                    className="w-full text-[13px] px-2 py-1.5 rounded-md border border-[#e0d8c8] bg-white outline-none focus:border-[#c9a84c] transition-colors"
                    style={{ color: "#1a2d4a" }}
                />
                <span className="text-[#b8ab93] text-xs">–</span>
                <input
                    type="number"
                    placeholder="Max"
                    value={maxValue}
                    onChange={(e) => onMax(e.target.value)}
                    className="w-full text-[13px] px-2 py-1.5 rounded-md border border-[#e0d8c8] bg-white outline-none focus:border-[#c9a84c] transition-colors"
                    style={{ color: "#1a2d4a" }}
                />
            </div>
        </div>
    );
}

export default function FilterPanel({ filters, setFilters, facets, colorTable, resultCount }) {
    const total = activeFilterCount(filters);

    const toggleIn = (key, value) => {
        setFilters((prev) => {
            const list = prev[key] || [];
            return {
                ...prev,
                [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
            };
        });
    };

    const setField = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    const landUseOptions = facets?.landUseOptions || [];
    const statusOptions = facets?.statusOptions || [];

    return (
        <div className="flex flex-col h-full bg-white border-r border-[#e8e2d8]">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[#e8e2d8] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} style={{ color: "#c9a84c" }} />
                    <span className="text-sm font-bold" style={{ color: "#1a2d4a", fontFamily: "Georgia, serif" }}>
                        Filters
                    </span>
                    {total > 0 && (
                        <span
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                            style={{ background: "#c9a84c", color: "#1a2d4a" }}
                        >
                            {total}
                        </span>
                    )}
                </div>
                {total > 0 && (
                    <button
                        onClick={() => setFilters(EMPTY_FILTERS)}
                        className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-70 transition-opacity"
                        style={{ color: "#9a8e7a" }}
                    >
                        <RotateCcw size={11} />
                        Reset
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-[#e8e2d8] shrink-0">
                <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#b8ab93]" />
                    <input
                        value={filters.q}
                        onChange={(e) => setField("q", e.target.value)}
                        placeholder="Plot no, name, owner, khasra…"
                        className="w-full text-[13px] pl-8 pr-3 py-2 rounded-lg border border-[#e0d8c8] bg-[#faf8f4] outline-none focus:border-[#c9a84c] focus:bg-white transition-colors"
                        style={{ color: "#1a2d4a" }}
                    />
                </div>
                <p className="text-[11px] mt-2" style={{ color: "#9a8e7a" }}>
                    <span className="font-bold" style={{ color: "#1a2d4a" }}>{resultCount}</span> plot
                    {resultCount === 1 ? "" : "s"} on map
                </p>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
                <Section title="Land Use" count={filters.landUse.length}>
                    {landUseOptions.map((option) => (
                        <CheckRow
                            key={option}
                            label={option}
                            swatch={colorTable?.[option]}
                            checked={filters.landUse.includes(option)}
                            onChange={() => toggleIn("landUse", option)}
                        />
                    ))}
                </Section>

                <Section title="Status" count={filters.status.length}>
                    {statusOptions.map((option) => (
                        <CheckRow
                            key={option}
                            label={option}
                            checked={filters.status.includes(option)}
                            onChange={() => toggleIn("status", option)}
                        />
                    ))}
                </Section>

                <Section title="Road" count={(filters.roadName ? 1 : 0) + (filters.minRoadWidth || filters.maxRoadWidth ? 1 : 0)}>
                    <input
                        list="gis-road-names"
                        value={filters.roadName}
                        onChange={(e) => setField("roadName", e.target.value)}
                        placeholder="Road name, e.g. ROAD 60M WIDE"
                        className="w-full text-[13px] px-2 py-1.5 rounded-md border border-[#e0d8c8] bg-white outline-none focus:border-[#c9a84c] transition-colors"
                        style={{ color: "#1a2d4a" }}
                    />
                    <datalist id="gis-road-names">
                        {(facets?.nearbyRoadName || []).map((road) => (
                            <option key={road} value={road} />
                        ))}
                    </datalist>

                    <RangeRow
                        label="Road width"
                        unit="ft"
                        minValue={filters.minRoadWidth}
                        maxValue={filters.maxRoadWidth}
                        onMin={(v) => setField("minRoadWidth", v)}
                        onMax={(v) => setField("maxRoadWidth", v)}
                    />
                </Section>

                <Section title="Size & Price" count={
                    (filters.minArea || filters.maxArea ? 1 : 0) + (filters.minRate || filters.maxRate ? 1 : 0)
                }>
                    <RangeRow
                        label="Plot area"
                        unit="m²"
                        minValue={filters.minArea}
                        maxValue={filters.maxArea}
                        onMin={(v) => setField("minArea", v)}
                        onMax={(v) => setField("maxArea", v)}
                    />
                    <RangeRow
                        label="Rate"
                        unit="₹/sq ft"
                        minValue={filters.minRate}
                        maxValue={filters.maxRate}
                        onMin={(v) => setField("minRate", v)}
                        onMax={(v) => setField("maxRate", v)}
                    />
                </Section>

                {!!facets?.zoneClassification?.length && (
                    <Section title="Zone" count={filters.zoneClassification.length} defaultOpen={false}>
                        {facets.zoneClassification.map((option) => (
                            <CheckRow
                                key={option}
                                label={option}
                                checked={filters.zoneClassification.includes(option)}
                                onChange={() => toggleIn("zoneClassification", option)}
                            />
                        ))}
                    </Section>
                )}

                {!!facets?.cluAvailability?.length && (
                    <Section title="CLU" count={filters.cluAvailability.length} defaultOpen={false}>
                        {facets.cluAvailability.map((option) => (
                            <CheckRow
                                key={option}
                                label={option}
                                checked={filters.cluAvailability.includes(option)}
                                onChange={() => toggleIn("cluAvailability", option)}
                            />
                        ))}
                    </Section>
                )}

                {!!facets?.frontFacing?.length && (
                    <Section title="Facing" count={filters.frontFacing.length} defaultOpen={false}>
                        {facets.frontFacing.map((option) => (
                            <CheckRow
                                key={option}
                                label={option}
                                checked={filters.frontFacing.includes(option)}
                                onChange={() => toggleIn("frontFacing", option)}
                            />
                        ))}
                    </Section>
                )}

                {!!facets?.estate?.length && (
                    <Section title="Estate" count={filters.estate.length} defaultOpen={false}>
                        {facets.estate.map((option) => (
                            <CheckRow
                                key={option}
                                label={option}
                                checked={filters.estate.includes(option)}
                                onChange={() => toggleIn("estate", option)}
                            />
                        ))}
                    </Section>
                )}
            </div>
        </div>
    );
}
