export interface KBOBMaterial {
  id: string;
  uuid: string;
  group: string;
  name: string;
  disposal: string;
  density: number;
  unit: string;
  ubpTotal: number;
  ubpProduction: number;
  ubpDisposal: number;
  ghgTotal: number;
  ghgProduction: number;
  ghgDisposal: number;
  nameFr: string;
  [key: string]: string | number; // Add string indexing
}

export interface MaterialsResponse {
  materials: {
    data: KBOBMaterial[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}
