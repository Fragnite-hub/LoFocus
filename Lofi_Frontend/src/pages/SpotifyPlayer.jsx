import SpotifyPremiumPlayer from "./SpotifyPremiumPlayer";
import SpotifyFreePlayer from "./SpotifyFreePlayer";

export default function SpotifyPlayer({ token, isPremium, playlist }) {
  if (isPremium) {
    return <SpotifyPremiumPlayer token={token} />;
  } else {
    return <SpotifyFreePlayer playlist={playlist} />;
  }
}
