import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentSegmentPage } from "@/components/academy/student-segment-page";
import { isWorkspaceSectionEnabled } from "@/features/workspace/workspace.storage";
export const Route = createFileRoute("/_authenticated/morning-students")({ beforeLoad: () => { if (!isWorkspaceSectionEnabled("morningShift")) throw redirect({ to: "/students" }); }, component: () => <StudentSegmentPage segment="Morning" /> });
