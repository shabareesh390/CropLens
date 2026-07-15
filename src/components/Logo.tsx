export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img src="/CropLens.png" alt="CropLens Logo" width={size} height={size} style={{ objectFit: 'contain' }} />
  );
}
