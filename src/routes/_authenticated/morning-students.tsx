import { createFileRoute } from "@tanstack/react-router";
import { StudentSegmentPage } from "@/components/academy/student-segment-page";
export const Route = createFileRoute("/_authenticated/morning-students")({ component: () => <StudentSegmentPage segment="Morning" /> });
