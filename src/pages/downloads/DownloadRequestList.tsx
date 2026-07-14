import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileDown } from "lucide-react";

export default function DownloadRequestList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: requests, isLoading } = trpc.downloadRequests.list.useQuery();
  const filtered = (requests ?? []).filter((r) => {
    const matchesSearch = search === "" || r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()) || r.property_title?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Type", "Property", "Date"];
    const rows = filtered.map((r) => [r.name || "", r.email || "", r.phone || "", r.type || "", r.property_title || "", r.created_at ? new Date(r.created_at).toLocaleDateString() : ""]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `download-requests-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const typeBadge = (type: string) => {
    switch (type) {
      case "brochure": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Brochure</Badge>;
      case "floor_plan": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Floor Plan</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-[#1E3A5F]">Download Requests</h1><p className="text-gray-500 text-sm mt-0.5">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p></div>
        <Button onClick={exportToCSV} variant="outline" className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/5"><FileDown className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="brochure">Brochure</SelectItem><SelectItem value="floor_plan">Floor Plan</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-gray-50"><TableHead className="font-semibold">Name</TableHead><TableHead className="font-semibold">Contact</TableHead><TableHead className="font-semibold">Type</TableHead><TableHead className="font-semibold">Property</TableHead><TableHead className="font-semibold">Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400"><Download className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p>No download requests found</p></TableCell></TableRow>
              ) : filtered.map((req) => (
                <TableRow key={req.id}><TableCell><p className="font-medium text-sm text-gray-900">{req.name}</p></TableCell><TableCell><div className="text-sm"><p className="text-gray-700">{req.email}</p>{req.phone && <p className="text-gray-500 text-xs">{req.phone}</p>}</div></TableCell><TableCell>{typeBadge(req.type)}</TableCell><TableCell><p className="text-sm text-gray-700 line-clamp-1">{req.property_title || "—"}</p></TableCell><TableCell className="text-sm text-gray-500">{req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
