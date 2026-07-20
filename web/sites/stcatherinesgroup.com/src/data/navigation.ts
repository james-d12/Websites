export interface NavSubItem {
  name: string;
  href: string;
}

export interface NavItem {
  name: string;
  href?: string;
  dropdown?: NavSubItem[];
}

export const services: NavSubItem[] = [
  { name: "1-1 Chaperone Carer", href: "/services/1-1-chaperone-carer" },
  {
    name: "1-1 Companionship Carer",
    href: "/services/1-1-companionship-carer",
  },
  { name: "1-1 Dementia Carer", href: "/services/1-1-dementia-carer" },
  { name: "1-1 Safety Carer", href: "/services/1-1-safety-carer" },
  { name: "Personal Assistants", href: "/services/personal-assistants" },
];

export const nurses: NavSubItem[] = [
  { name: "Care Home Nurses", href: "/nurses/carehome-nurses" },
  { name: "Hospital Nurses", href: "/nurses/hospital-nurses" },
  { name: "Practice Nurses", href: "/nurses/practice-nurses" },
];

export const navLinks: NavItem[] = [
  { name: "About", href: "/about-us" },
  { name: "Services", dropdown: services },
  { name: "Nurses", dropdown: nurses },
  { name: "Testimonials", href: "/testimonials" },
  { name: "Contact", href: "/contact" },
];
