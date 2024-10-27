import { Page as SettingsPage } from "../pages/app-settings-page";

export default function Settings({ params }: { params: { slug: string[] } }) {
  const tab = params.slug?.[0] || "general";
  return <SettingsPage defaultTab={tab} />;
}
