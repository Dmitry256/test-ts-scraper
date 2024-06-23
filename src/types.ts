
export type ParsedLinkElementType = { 
  text: string | number,
  href: string | undefined 
};

export type ParsedHTMLEementType = 
  | string
  | number
  | Date 
  | string[] 
  | ParsedLinkElementType;