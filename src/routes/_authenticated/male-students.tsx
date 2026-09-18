import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentSegmentPage } from "@/components/academy/student-segment-page";
import { isWorkspaceSectionEnabled } from "@/features/workspace/workspace.storage";
export const Route = createFileRoute("/_authenticated/male-students")({ beforeLoad: () => { if (!isWorkspaceSectionEnabled("maleStudents")) throw redirect({ to: "/students" }); }, component: () => <StudentSegmentPage segment="Male" /> });
