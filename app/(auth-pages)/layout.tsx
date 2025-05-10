export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="max-w-7xl w-full">{children}</div>
    </div>
  );
}
