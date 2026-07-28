export default function Home() {
  return (
    <main className="app-shell">
      <iframe
        className="app-frame"
        src="/index.html"
        title="INGTEC Inspektion App"
        allow="camera"
      />
    </main>
  );
}
