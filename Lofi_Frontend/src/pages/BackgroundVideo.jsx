export default function BackgroundVideo({ src }) {
  return (
    <video key={src} autoPlay loop muted className="bgVideo">
      <source src={src} type="video/mp4" />
    </video>
  );
}
