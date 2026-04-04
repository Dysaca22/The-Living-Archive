declare module '@svg-maps/world' {
  interface SvgMapLocation {
    id: string;
    name: string;
    path: string;
  }

  interface SvgMapData {
    label: string;
    viewBox: string;
    locations: SvgMapLocation[];
  }

  const map: SvgMapData;
  export default map;
}
