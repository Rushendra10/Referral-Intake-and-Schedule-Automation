"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * ZIP coverage table — the page TinyFish browses during eligibility checks.
 *
 * Data matches COVERED_ZIPS in backend/tinyfish/eligibility/engine.ts.
 * When `highlight` prop is set, that ZIP row gets a golden glow animation.
 */

const ZIP_DATA = [
  { zip: "75201", city: "Dallas (Downtown)", covered: true },
  { zip: "75202", city: "Dallas (Uptown)", covered: true },
  { zip: "75203", city: "Dallas (Oak Cliff)", covered: true },
  { zip: "75204", city: "Dallas (Greenville Ave)", covered: true },
  { zip: "75205", city: "Dallas (Highland Park)", covered: true },
  { zip: "75206", city: "Dallas (Lower Greenville)", covered: true },
  { zip: "75207", city: "Dallas (Design District)", covered: true },
  { zip: "75208", city: "Dallas (Kessler Park)", covered: true },
  { zip: "75209", city: "Dallas (Love Field area)", covered: true },
  { zip: "75210", city: "Dallas (South Dallas)", covered: true },
  { zip: "75211", city: "Dallas (West Dallas)", covered: false },
  { zip: "75212", city: "Dallas (Trinity Groves)", covered: false },
  { zip: "75214", city: "Dallas (Lakewood)", covered: true },
  { zip: "75215", city: "Dallas (Fair Park)", covered: true },
  { zip: "75216", city: "Dallas (Red Bird)", covered: false },
  { zip: "75219", city: "Dallas (Oak Lawn)", covered: true },
  { zip: "75220", city: "Dallas (Preston Hollow)", covered: true },
  { zip: "75225", city: "Dallas (University Park)", covered: true },
  { zip: "75230", city: "Dallas (North Dallas)", covered: true },
  { zip: "75231", city: "Dallas (Vickery Meadow)", covered: true },
  { zip: "75235", city: "Dallas (Medical District)", covered: true },
  { zip: "75240", city: "Dallas (Far North)", covered: true },
  { zip: "75244", city: "Dallas (Farmers Branch)", covered: true },
  { zip: "76101", city: "Fort Worth (Downtown)", covered: true },
  { zip: "76102", city: "Fort Worth (Near South)", covered: true },
  { zip: "76103", city: "Fort Worth (East)", covered: true },
  { zip: "76104", city: "Fort Worth (Fairmount)", covered: true },
  { zip: "76107", city: "Fort Worth (Cultural District)", covered: true },
  { zip: "76110", city: "Fort Worth (Ryan Place)", covered: true },
  { zip: "76116", city: "Fort Worth (Ridglea)", covered: true },
  { zip: "76120", city: "Fort Worth (East FW)", covered: true },
  { zip: "76132", city: "Fort Worth (Wedgwood)", covered: true },
  { zip: "76137", city: "Fort Worth (North FW)", covered: true },
  { zip: "73301", city: "Austin (Suburbs)", covered: false },
  { zip: "77002", city: "Houston (Downtown)", covered: false },
  { zip: "77005", city: "Houston (Rice University)", covered: false },
];

export default function CoverageZipsClient({ highlight }: { highlight?: string }) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-zinc-800">
      {/* Agency header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold">
            TF
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-800">SunCare Home Health</div>
            <div className="text-xs text-zinc-500">Agency Management Portal</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            System Online
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-4xl px-8 py-8">
        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-zinc-800">Service Coverage Map</h1>
            <p className="text-sm text-zinc-500">
              ZIP codes currently served by SunCare Home Health operations. Updated weekly.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total ZIPs", value: ZIP_DATA.length },
            { label: "In Coverage", value: ZIP_DATA.filter((z) => z.covered).length },
            { label: "Out of Coverage", value: ZIP_DATA.filter((z) => !z.covered).length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-zinc-800">{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 bg-zinc-50 hover:bg-zinc-50">
                <TableHead className="text-zinc-600">ZIP Code</TableHead>
                <TableHead className="text-zinc-600">Area</TableHead>
                <TableHead className="text-zinc-600">Coverage Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ZIP_DATA.map((row) => {
                const isHighlighted = highlight && row.zip === highlight;
                return (
                  <TableRow
                    key={row.zip}
                    className={`border-zinc-100 ${
                      isHighlighted
                        ? "bg-amber-50"
                        : "bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <TableCell className="font-mono text-sm font-medium text-zinc-800">
                      {isHighlighted ? (
                        <motion.span
                          initial={{ backgroundColor: "transparent" }}
                          animate={{ backgroundColor: ["#fef3c7", "#fbbf24", "#fef3c7"] }}
                          transition={{ duration: 1.5, repeat: 2 }}
                          className="inline-block rounded px-1"
                        >
                          {row.zip}
                        </motion.span>
                      ) : (
                        row.zip
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-600">{row.city}</TableCell>
                    <TableCell>
                      {row.covered ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          In Coverage
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                          <XCircle className="h-3.5 w-3.5" />
                          Not Covered
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Demo watermark */}
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">
          ⚠ This is a simulated agency operational page for demonstration purposes only.
        </div>
      </div>
    </div>
  );
}
