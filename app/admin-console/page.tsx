import { useUser } from "@clerk/nextjs";

export default function AdminConsole() {
  const { user } = useUser();

  // Check if the user has admin status
  const isAdmin = user?.publicMetadata?.role === "admin"; // Adjust this based on how you store roles

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>;
  }

  return <div>{/* Admin console content goes here */}</div>;
}
