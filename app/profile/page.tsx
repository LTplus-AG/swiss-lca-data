import { Page as ProfilePage } from "../pages/app-profile-page";

export default function Profile({ params }: { params: { slug: string[] } }) {
  const tab = params.slug?.[0] || "info";
  return <ProfilePage defaultTab={tab} />;
}
