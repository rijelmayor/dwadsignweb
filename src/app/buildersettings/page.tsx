import BuilderSettings from "./BuilderSettings";

export const metadata = {
  title: "Builder Settings",
  description: "Manage landing page content, quote defaults, and sign catalog.",
  robots: "noindex" as const,
};

export default function BuilderSettingsPage() {
  return <BuilderSettings />;
}
