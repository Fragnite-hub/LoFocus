import { useEffect } from "react";
import MusicPlayer from "./MusicPlayer";
import { showToast } from "../toast";

export default function SpotifyFreePlayer({ playlist }) {
  useEffect(() => {
    showToast("Spotify Premium is required to sync music. Falling back to default Lofi beats.", "error");
  }, []);

  return <MusicPlayer playlist={playlist} />;
}
