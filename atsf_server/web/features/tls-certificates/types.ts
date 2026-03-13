export interface TlsCertificateItem {
  id: number;
  name: string;
  cert_pem?: string;
  key_pem?: string;
  not_before: string;
  not_after: string;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface TlsCertificateDetailItem extends TlsCertificateItem {
  cert_pem?: never;
  key_pem?: never;
}

export interface TlsCertificateContentItem extends TlsCertificateItem {
  cert_pem: string;
  key_pem: string;
}

export interface TlsCertificateMutationPayload {
  name: string;
  cert_pem: string;
  key_pem: string;
  remark: string;
}

export interface TlsCertificateFileImportPayload {
  name: string;
  remark: string;
  certFile: File;
  keyFile: File;
}
