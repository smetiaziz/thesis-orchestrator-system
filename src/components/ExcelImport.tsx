
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { FileUp, Check, AlertTriangle, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

interface ExcelImportProps {
  endpoint: string;
  title: string;
  description: string;
  successMessage: string;
  errorMessage: string;
  onSuccess?: () => void;
  templateUrl?: string;
}

const ExcelImport: React.FC<ExcelImportProps> = ({
  endpoint,
  title,
  description,
  successMessage,
  errorMessage,
  onSuccess,
  templateUrl,
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if the file is an Excel file
      if (
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setFile(selectedFile);
        setUploadStatus("idle");
        setErrorDetails("");
        setUploadResult(null);
      } else {
        toast({
          title: "Invalid file format",
          description: "Please select an Excel file (.xls or .xlsx)",
          variant: "destructive",
        });
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");
    setErrorDetails("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // We need to use fetch directly as our api utility doesn't support FormData
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred while importing data");
      }

      setUploadStatus("success");
      setUploadResult(data);
      
      toast({
        title: "Import successful",
        description: `${successMessage} (${data.count || 0} records imported)`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setUploadStatus("error");
      setErrorDetails(error.message);
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {uploadStatus === "success" && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            {successMessage}
            {uploadResult && (
              <div className="mt-2">
                <p>Records imported: {uploadResult.count}</p>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <p>With {uploadResult.errors.length} warnings/errors</p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorDetails || errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Input
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="mb-2"
          />
          <p className="text-xs text-muted-foreground">
            Accepted formats: .xls, .xlsx
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload and Import
              </>
            )}
          </Button>

          {templateUrl && (
            <Button variant="outline" asChild>
              <a href={templateUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </a>
            </Button>
          )}
        </div>
        
        {uploadResult && uploadResult.errors && uploadResult.errors.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h3 className="font-semibold text-amber-800 mb-2">Warnings/Errors:</h3>
            <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
              {uploadResult.errors.map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExcelImport;
