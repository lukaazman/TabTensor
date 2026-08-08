declare module 'expo-document-picker' {
  export type DocumentPickerAsset = {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
    lastModified?: number;
  };

  export type DocumentPickerResult =
    | { canceled: true; assets?: undefined }
    | { canceled: false; assets: DocumentPickerAsset[] };

  export function getDocumentAsync(options?: {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }): Promise<DocumentPickerResult>;
}

declare module 'expo-keep-awake' {
  export function useKeepAwake(tag?: string, options?: unknown): void;
}
