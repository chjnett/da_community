import { apiRequest, API_BASE_URL } from "./httpClient";

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface FileUploadResponse {
  url: string;
  key: string;
}

export const fileApi = {
  /**
   * [Production] Cloudflare R2용 Presigned URL 발급
   */
  async getPresignedUrl(fileName: string, contentType: string): Promise<PresignedUrlResponse> {
    return await apiRequest<PresignedUrlResponse>("/files/presigned", {
      method: "POST",
      body: { fileName, contentType },
    });
  },

  /**
   * [Production] 발급받은 URL로 파일 직접 업로드
   */
  async uploadToR2(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to R2");
    }
  },

  /**
   * [Dev/Test] 서버로 직접 파일 업로드 (Multipart)
   */
  async upload(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      body: formData,
      // Note: fetch automatically sets the Content-Type to multipart/form-data with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.error?.message || "File upload failed");
    }

    return await response.json();
  }
};
