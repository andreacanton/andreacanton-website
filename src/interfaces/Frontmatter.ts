export default interface Frontmatter {
  date: Date;
  title: string;
  image?: string;
  tags?: string;
  canonicalUrl?: string;
  draft?: boolean;
  lastUpdate?: Date;
  description?: string;
  subtitle?: string;
}
