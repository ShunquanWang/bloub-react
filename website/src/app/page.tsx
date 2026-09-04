import { BloubApp } from '@/bloub';

/** Full bloub studio demo (BloubBot from `bloub-react`). */
export default function HomePage() {
  return (
    <>
      <h1 className="sr-only">
        bloub — animated SVG bot avatar studio for React
      </h1>
      <p className="sr-only">
        Customise body shapes and colours, edit animation timelines, and export
        SVG, PNG, GIF, or MP4. A React port of the open-source bloub project.
      </p>
      <div id="app">
        <BloubApp />
      </div>
    </>
  );
}
