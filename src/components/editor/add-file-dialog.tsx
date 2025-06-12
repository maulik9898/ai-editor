"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Upload, FileText } from "lucide-react";
import {
  FILE_TYPES,
  normalizeFileName,
  readFileFromSystem,
} from "@/lib/file-utils";

interface AddFileDialogProps {
  onCreateFile: (name: string, content: string, language?: string) => boolean;
}

export function AddFileDialog({ onCreateFile }: AddFileDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("json");
  const [isImporting, setIsImporting] = useState(false);

  const handleCreate = () => {
    if (!fileName.trim()) return;

    const finalFileName = normalizeFileName(fileName, fileType);
    const success = onCreateFile(finalFileName, "", fileType);

    if (success) {
      resetAndClose();
    }
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const fileData = await readFileFromSystem();

      if (fileData) {
        const success = onCreateFile(
          fileData.name,
          fileData.content,
          fileData.language,
        );
        if (success) {
          resetAndClose();
        }
      }
    } catch (error) {
      console.error("Error importing file:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const resetAndClose = () => {
    setFileName("");
    setFileType("json");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isImporting) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add File</DialogTitle>
          <DialogDescription>
            Create a new file or import an existing file from your system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Import Option */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleImport}
              disabled={isImporting}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import File from System"}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create new
              </span>
            </div>
          </div>

          {/* Create New File */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="fileName" className="text-sm font-medium">
                File Name
              </label>
              <Input
                id="fileName"
                placeholder="Enter file name..."
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isImporting}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="fileType" className="text-sm font-medium">
                File Type
              </label>
              <Select
                value={fileType}
                onValueChange={setFileType}
                disabled={isImporting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {type.label} ({type.extension})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={resetAndClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!fileName.trim() || isImporting}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
