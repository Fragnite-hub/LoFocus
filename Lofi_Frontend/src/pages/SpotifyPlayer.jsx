import SpotifyPremiumPlayer from "./SpotifyPremiumPlayer";
import SpotifyFreePlayer from "./SpotifyFreePlayer";

export default function SpotifyPlayer({ token, isPremium }) {
  if (isPremium) {
    return <SpotifyPremiumPlayer token={token} />;
  } else {
    return <SpotifyFreePlayer />;
  }
}
