import { createFileRoute } from "@tanstack/react-router";
import { StudentSegmentPage } from "@/components/academy/student-segment-page";
export const Route = createFileRoute("/_authenticated/male-students")({ component: () => <StudentSegmentPage segment="Male" /> });
