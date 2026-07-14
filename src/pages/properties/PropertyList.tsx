import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PROPERTY_STATUS, PROPERTY_TYPES } from "@/types";
import { Plus, Search, Pencil, Trash2, Star, Eye } from "lucide-react";

interface Property {
  id: string;
  slug: string;
  title: string;
  location: string;
  property_type: string;
  price: number;
  price_display?: string;
  status: string;
  featured: boolean;
  images?: string[];
}

async function fetchProperties(): Promise<Property[]> {
  try {
    const res = await fetch("/api/cms/properties");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function deleteProperty(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cms/properties/${slug}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export default function PropertyList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const data = await fetchProperties();
    setProperties(data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (slug: string) => {
    setDeletingSlug(slug);
    const ok = await deleteProperty(slug);
    if (ok) {
      setProperties((prev) => prev.filter((p) => p.slug !== slug));
    }
    setDeletingSlug(null);
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesType = typeFilter === "all" || p.property_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "sold_out":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Sold Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Properties</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} propert{filtered.length !== 1 ? "ies" : "y"}</p>
        </div>
        <Link to="/properties/new">
          <Button className="bg-[#1E3A5F] hover:bg-[#152d4a]"><Plus className="h-4 w-4 mr-2" />Add Property</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by title, location, or slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PROPERTY_STATUS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Property</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Featured</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No properties found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((property) => (
                  <TableRow key={property.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {property.images?.length > 0 ? (
                          <img src={property.images[0]} alt={property.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Eye className="h-4 w-4 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-gray-900 line-clamp-1">{property.title}</p>
                          <p className="text-xs text-gray-500">{property.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{property.location}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{property.property_type}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">{property.price_display || `AED ${property.price?.toLocaleString()}`}</TableCell>
                    <TableCell>{statusBadge(property.status)}</TableCell>
                    <TableCell className="text-center">{property.featured && <Star className="h-4 w-4 text-[#C9A84C] mx-auto fill-[#C9A84C]" />}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/properties/${property.id}`}><Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button></Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Property</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{property.title}"? This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(property.slug)} disabled={deletingSlug === property.slug} className="bg-red-600 hover:bg-red-700">
                                {deletingSlug === property.slug ? "Deleting..." : "Delete"}
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
