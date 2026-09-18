import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentSegmentPage } from "@/components/academy/student-segment-page";
import { isWorkspaceSectionEnabled } from "@/features/workspace/workspace.storage";
export const Route = createFileRoute("/_authenticated/evening-students")({ beforeLoad: () => { if (!isWorkspaceSectionEnabled("eveningShift")) throw redirect({ to: "/students" }); }, component: () => <StudentSegmentPage segment="Evening" /> });
