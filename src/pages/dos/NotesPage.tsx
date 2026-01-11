import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClasses } from "@/hooks/useDatabase";
import { toast } from "sonner";

interface Note {
  id: string;
  note: string;
  date: string;
}

export default function NotesPage() {
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [note, setNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  // Load notes on mount and when classId changes
  useEffect(() => {
    const key = `dos_notes_${classId || 'general'}`;
    const stored = localStorage.getItem(key);
    setSavedNotes(stored ? JSON.parse(stored) : []);
  }, [classId]);

  const saveNote = () => {
    if (!note.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    const key = `dos_notes_${classId || 'general'}`;
    const existing = localStorage.getItem(key);
    const payload: Note = { 
      id: Date.now().toString(), 
      note, 
      date: new Date().toLocaleDateString() 
    };
    const arr = existing ? JSON.parse(existing) : [];
    arr.unshift(payload);
    localStorage.setItem(key, JSON.stringify(arr));
    setSavedNotes(arr);
    setNote("");
    toast.success("Note saved successfully");
  };

  const deleteNote = (id: string) => {
    const key = `dos_notes_${classId || 'general'}`;
    const updated = savedNotes.filter(n => n.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    setSavedNotes(updated);
    toast.success("Note deleted");
  };

  return (
    <DashboardLayout>
      <PageHeader title="Brief Notes" description="Add short notes about classes or general academic items" icon={FileText} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-6 shadow-md h-fit">
          <h3 className="font-semibold mb-4">Add New Note</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Class (optional)</label>
              <select className="w-full px-3 py-2 border rounded" value={classId} onChange={(e: any) => setClassId(e.target.value)}>
                <option value="">General</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Note</label>
              <Textarea value={note} onChange={(e: any) => setNote(e.target.value)} rows={6} placeholder="Write your note here..." />
            </div>
            <Button onClick={saveNote} className="w-full">Save Note</Button>
          </div>
        </div>

        {/* Notes Display Section */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-md">
          <h3 className="font-semibold mb-4">Saved Notes {classId && `(${classes.find((c: any) => c.id === classId)?.class_name || 'Class'})`}</h3>
          {savedNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No notes saved yet</div>
          ) : (
            <div className="space-y-3">
              {savedNotes.map((n) => (
                <div key={n.id} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{n.date}</span>
                    <Button size="sm" variant="ghost" onClick={() => deleteNote(n.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <p className="text-sm">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
