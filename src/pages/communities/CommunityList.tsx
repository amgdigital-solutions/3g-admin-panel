import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { COMMUNITY_STATUS } from "@/types";
import { Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";

interface Community {
  id: string;
  slug: string;
  name: string;
  location: string;
  avg_price: string;
  property_types: string[];
  status: string;
  image?: string;
}

async function fetchCommunities(): Promise<Community[]> {
  try {
    const res = await fetch("/api/cms/communities");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function deleteCommunity(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cms/communities/${slug}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export default function CommunityList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const data = await fetchCommunities();
    setCommunities(data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (slug: string) => {
    setDeletingSlug(slug);
    const ok = await deleteCommunity(slug);
    if (ok) {
      setCommunities((prev) => prev.filter((c) => c.slug !== slug));
    }
    setDeletingSlug(null);
  };

  const filtered = communities.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Communities</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} communit{filtered.length !== 1 ? "ies" : "y"}</p>
        </div>
        <Link to="/communities/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Add Community</Button>
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {COMMUNITY_STATUS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Community</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Avg. Price</TableHead>
                <TableHead className="font-semibold">Property Types</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p>No communities found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((community) => (
                  <TableRow key={community.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {community.image ? (
                          <img src={community.image} alt={community.name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><MapPin className="h-4 w-4 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-gray-900">{community.name}</p>
                          <p className="text-xs text-gray-500">{community.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{community.location}</TableCell>
                    <TableCell className="text-sm font-medium">{community.avg_price}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(community.property_types || []).slice(0, 2).map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                        {(community.property_types || []).length > 2 && <Badge variant="outline" className="text-xs">+{(community.property_types || []).length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(community.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/communities/${community.id}`}><Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Community</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(community.slug)} disabled={deletingSlug === community.slug} className="bg-red-600 hover:bg-red-700">
                                {deletingSlug === community.slug ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
