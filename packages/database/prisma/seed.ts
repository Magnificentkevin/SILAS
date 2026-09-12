import { PrismaClient, LedgerAccountType, IntegrationCategory } from '@prisma/client';

const prisma = new PrismaClient();

const ledgerAccounts = [
  {
    code: '1010-SILAS-FBO-OPERATING',
    name: 'SILAS FBO Operating',
    type: LedgerAccountType.ASSET,
    category: 'Settlement Clearing',
  },
  {
    code: '2100-VENDOR-PAYABLE',
    name: 'Vendor Payable',
    type: LedgerAccountType.LIABILITY,
    category: 'Current Liability',
  },
];

const skus = [
  { code: 'CHEM-FIN-05G', name: 'Finishing Chemical 5G', category: 'Chemical' },
  { code: 'CHEM-NEUT-01G', name: 'Neutralizer Chemical 1G', category: 'Chemical' },
  { code: 'PAD-BUFF-20', name: 'Buffer Pad 20', category: 'Pad' },
];

// First round of external systems SILAS's adapters target, from Software served.xlsx,
// plus the platform surfaces (browser + mobile) the Context Boundary mechanism runs on.
const integrationProviders: { name: string; category: IntegrationCategory; bestFor?: string }[] = [
  // Facility Management
  { name: 'IBM Maximo', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Large enterprise asset management and complex infrastructure tracking.' },
  { name: 'Archibus', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Integrated workplace management (IWMS), space planning, and CAD integration.' },
  { name: 'IBM TRIRIGA', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Enterprise-grade real estate, energy management, and space optimization.' },
  { name: 'Facilio', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'IoT-driven, multi-site operations and real-time portfolio oversight.' },
  { name: 'MaintainX', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Mobile-first work orders, digital checklists, and team communication.' },
  { name: 'Fiix', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Cloud-based maintenance tracking, analytics, and multi-site operations.' },
  { name: 'eMaint CMMS', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Customizable preventive maintenance and heavy equipment tracking.' },
  { name: 'UpKeep', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Asset-heavy small and medium businesses (SMBs) with mobile functionality.' },
  { name: 'FMX', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Education (K-12 and higher ed), event scheduling, and facilities operations.' },
  { name: 'Corrigo', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Multi-location businesses that require robust contractor and vendor management.' },
  { name: 'Hippo CMMS', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Small-to-midsize teams needing straightforward asset and work order tracking.' },
  { name: 'ServiceChannel', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Multi-location enterprises (retail and restaurants) managing contractor compliance.' },
  { name: 'Accruent Maintenance Connection', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Web-based work order tracking, labor scheduling, and preventive maintenance.' },
  { name: 'MRI Facility Management', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Centralized property management, space planning, and lease accounting.' },
  { name: 'Planon', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Sustainable building management, smart workplace services, and integrated real estate.' },
  { name: 'Spacewell', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Smart building data, IoT sensor integration, and agile workplace occupancy.' },
  { name: 'OfficeSpace Software', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Hybrid workspace management, desk booking, and move management.' },
  { name: 'FacilityForce', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Government agencies and public sector compliance audits.' },
  { name: 'Asset Panda', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Customizable, cloud-based asset tracking, barcode scanning, and inventory control.' },
  { name: 'AkitaBox', category: IntegrationCategory.FACILITY_MANAGEMENT, bestFor: 'Building condition assessments and capital planning for aging infrastructure.' },
  // Employee Management
  { name: 'Auto Shift Planner', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Automating employee shift schedules.' },
  { name: 'Schedwi', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Task scheduling with file-based triggers.' },
  { name: 'ServiceMax', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Field service scheduling and dispatch.' },
  { name: 'Booked Scheduler', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Clubs and non-profit organizations.' },
  { name: 'WP-HR Manager Software', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'WordPress-based HR solutions.' },
  { name: 'evQueue', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Event-driven job scheduling and workflow execution.' },
  { name: 'Schedulix', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'IT employee workload automation.' },
  { name: 'StaffRoster', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Larger organizations with complex shift constraints.' },
  { name: 'TimeTrex', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Flexible scheduling needs.' },
  { name: 'Shifton', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Teams needing modular shift planning.' },
  { name: 'Zoho People', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Full HRIS integration, onboarding, and leave management.' },
  { name: '15Five', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Performance reviews, goal tracking, and manager coaching.' },
  { name: 'Homebase', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Hourly local businesses, retail, and food service.' },
  { name: 'Sling', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Simple shift scheduling and internal communication.' },
  { name: 'Deputy', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Labor forecasting and compliance-aware auto-scheduling.' },
  { name: 'Gusto', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Payroll-first management for US teams.' },
  { name: 'Connecteam', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Frontline workers and deskless teams with GPS needs.' },
  { name: 'When I Work', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Restaurants and retail emphasizing shift swapping.' },
  { name: '7shifts', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Restaurant businesses needing built-in tip management.' },
  { name: 'Zoomshift', category: IntegrationCategory.EMPLOYEE_MANAGEMENT, bestFor: 'Retail and hourly shift planning with labor cost tracking.' },
  // Project Management
  { name: 'Wrike', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Large projects and scaling.' },
  { name: 'monday.com', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'AI-powered resource optimization and customizable boards.' },
  { name: 'Asana', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Cross-functional teams needing intuitive task tracking.' },
  { name: 'Smartsheet', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Customizable dashboards and spreadsheet-based management.' },
  { name: 'Jira', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Software development workflows and Agile teams.' },
  { name: 'ClickUp', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Customized task views and AI-powered assistance.' },
  { name: 'Trello', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Visually managing projects with Kanban boards.' },
  { name: 'Zoho Projects', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Small and growing teams needing affordable tools.' },
  { name: 'Teamwork', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Client-based work and agency management.' },
  { name: 'Basecamp', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Beginners and teams without a dedicated project manager.' },
  { name: 'GanttPro', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Beginners needing a straightforward Gantt chart experience.' },
  { name: 'Airtable', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Building a highly customized project management app.' },
  { name: 'Runn', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Project forecasting and capacity planning.' },
  { name: 'Celoxis', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Simplified planning and complex workflows.' },
  { name: 'Productive', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Agency projects and budgeting.' },
  { name: 'Copper', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Agencies streamlining sales to delivery.' },
  { name: 'Quire', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Detailed task breakdown.' },
  { name: 'Workzone', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Comprehensive project visibility.' },
  { name: 'Zapier', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'AI orchestration and automation across your app stack.' },
  { name: 'Baserow', category: IntegrationCategory.PROJECT_MANAGEMENT, bestFor: 'Building custom, open-source project management systems.' },
  // Platform surfaces (Context Boundary mechanism targets)
  { name: 'Chrome', category: IntegrationCategory.PLATFORM, bestFor: 'Browser-side context boundary and isolated overlay injection.' },
  { name: 'Google', category: IntegrationCategory.PLATFORM, bestFor: 'SSO/identity and Workspace API surface.' },
  { name: 'Android', category: IntegrationCategory.PLATFORM, bestFor: 'Field/mobile embodiment of the offline client.' },
  { name: 'iOS', category: IntegrationCategory.PLATFORM, bestFor: 'Field/mobile embodiment of the offline client.' },
];

async function main() {
  for (const provider of integrationProviders) {
    await prisma.integrationProvider.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
  }

  for (const account of ledgerAccounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      update: account,
      create: account,
    });
  }

  for (const sku of skus) {
    await prisma.sku.upsert({
      where: { code: sku.code },
      update: sku,
      create: sku,
    });
  }

  console.log(
    `Seeded ${integrationProviders.length} integration providers, ${ledgerAccounts.length} ledger accounts, and ${skus.length} SKUs.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
