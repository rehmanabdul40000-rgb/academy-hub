import { createFileRoute } from "@tanstack/react-router";
import { StudentSegmentPage } from "@/components/academy/student-segment-page";
export const Route = createFileRoute("/_authenticated/evening-students")({ component: () => <StudentSegmentPage segment="Evening" /> });
