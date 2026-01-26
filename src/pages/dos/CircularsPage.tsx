import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { FileText, Upload, Download, Trash2, File, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Circular {
    id: string;
    title: string;
    description: string;
    fileName: string;
    fileType: "pdf" | "word";
    fileSize: number;
    uploadedBy: string;
    uploadDate: string;
    fileData: string;
}

export default function CircularsPage() {
    const [circulars, setCirculars] = useState<Circular[]>(() => {
        const stored = localStorage.getItem("dos_circulars");
        return stored ? JSON.parse(stored) : [];
    });

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const allowedFormats = [".pdf", ".doc", ".docx"];
    const maxFileSize = 10 * 1024 * 1024;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        const fileExtension = selectedFile.name
            .substring(selectedFile.name.lastIndexOf("."))
            .toLowerCase();
        if (!allowedFormats.includes(fileExtension)) {
            toast.error("Only PDF and Word documents are allowed");
            setFile(null);
            return;
        }

        if (selectedFile.size > maxFileSize) {
            toast.error("File size must be less than 10MB");
            setFile(null);
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!title.trim()) {
            toast.error("Please enter a circular title");
            return;
        }

        if (!description.trim()) {
            toast.error("Please enter a description");
            return;
        }

        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setIsUploading(true);

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                const fileData = event.target?.result as string;
                const fileExtension = file.name
                    .substring(file.name.lastIndexOf("."))
                    .toLowerCase();
                const fileType = fileExtension === ".pdf" ? "pdf" : "word";

                const newCircular: Circular = {
                    id: Date.now().toString(),
                    title: title.trim(),
                    description: description.trim(),
                    fileName: file.name,
                    fileType,
                    fileSize: file.size,
                    uploadedBy: localStorage.getItem("userName") || "Administrator",
                    uploadDate: new Date().toLocaleDateString(),
                    fileData,
                };

                const updated = [newCircular, ...circulars];
                setCirculars(updated);
                localStorage.setItem("dos_circulars", JSON.stringify(updated));

                toast.success(`Circular "${title}" uploaded successfully`);

                setTitle("");
                setDescription("");
                setFile(null);
                setOpenDialog(false);

                const fileInput = document.querySelector(
                    'input[type="file"]'
                ) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            };
            reader.readAsDataURL(file);
        } catch (error) {
            toast.error("Failed to upload circular");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = (circular: Circular) => {
        try {
            const link = document.createElement("a");
            link.href = circular.fileData;
            link.download = circular.fileName;
            link.click();
            toast.success(`Downloaded ${circular.fileName}`);
        } catch (error) {
            toast.error("Failed to download file");
            console.error(error);
        }
    };

    const handleDelete = (id: string) => {
        const updated = circulars.filter((c) => c.id !== id);
        setCirculars(updated);
        localStorage.setItem("dos_circulars", JSON.stringify(updated));
        toast.success("Circular deleted successfully");
    };

    const handleView = (circular: Circular) => {
        try {
            const link = document.createElement("a");
            link.href = circular.fileData;
            link.target = "_blank";
            link.click();
            toast.success(`Opening ${circular.fileName}`);
        } catch (error) {
            toast.error("Failed to open file");
            console.error(error);
        }
    };

    const columns = [
        { key: "title", label: "Title", width: "25%" },
        { key: "description", label: "Description", width: "30%" },
        {
            key: "fileType",
            label: "Type",
            width: "10%",
            render: (value: string) => (
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${value === "pdf"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                >
                    {value.toUpperCase()}
                </span>
            ),
        },
        {
            key: "fileSize",
            label: "Size",
            width: "10%",
            render: (value: number) => `${(value / 1024 / 1024).toFixed(2)}MB`,
        },
        { key: "uploadedBy", label: "Uploaded By", width: "12%" },
        { key: "uploadDate", label: "Date", width: "13%" },
        {
            key: "id",
            label: "Actions",
            width: "auto",
            render: (_: string, row: Circular) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(row)}
                        title="View document"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(row)}
                        title="Download document"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete document"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <PageHeader
                title="Circular Documents"
                description="Upload, manage, and distribute circular documents to the school community."
                icon={FileText}
            />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Circular
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Upload Circular Document</DialogTitle>
                            <DialogDescription>
                                Upload PDF or Word documents (max 10MB) to distribute to all
                                stakeholders.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Circular Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., School Holiday Notice"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the circular content..."
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file">Document File</Label>
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                                    <input
                                        id="file"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="file" className="cursor-pointer">
                                        <File className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                                        <p className="font-medium">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            PDF or Word documents (Max 10MB)
                                        </p>
                                        {file && (
                                            <p className="text-sm text-green-600 mt-2">
                                                ✓ {file.name} (
                                                {(file.size / 1024 / 1024).toFixed(2)}MB)
                                            </p>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !file}
                                className="w-full"
                            >
                                {isUploading ? "Uploading..." : "Upload Circular"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {circulars.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={circulars}
                        onView={(row) => handleView(row)}
                    />
                ) : (
                    <div className="text-center py-12 bg-card rounded-lg border border-border">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">
                            No circulars uploaded yet
                        </p>
                        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Upload First Circular</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Upload Circular Document</DialogTitle>
                                    <DialogDescription>
                                        Upload PDF or Word documents (max 10MB) to distribute to all
                                        stakeholders.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Circular Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g., School Holiday Notice"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Brief description of the circular content..."
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="file">Document File</Label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                                            <input
                                                id="file"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <label htmlFor="file" className="cursor-pointer">
                                                <File className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                                                <p className="font-medium">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    PDF or Word documents (Max 10MB)
                                                </p>
                                                {file && (
                                                    <p className="text-sm text-green-600 mt-2">
                                                        ✓ {file.name} (
                                                        {(file.size / 1024 / 1024).toFixed(2)}MB)
                                                    </p>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading || !file}
                                        className="w-full"
                                    >
                                        {isUploading ? "Uploading..." : "Upload Circular"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}