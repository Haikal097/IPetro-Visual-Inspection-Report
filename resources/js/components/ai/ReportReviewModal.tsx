import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import ReportReviewAssistantPanel from "./ReportReviewAssistantPanel";

type Props = {
  open: boolean;
  onClose: () => void;
  report: any;
};

export default function ReportReviewModal({ open, onClose, report }: Props) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* 🔹 Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* 🔹 Centered modal container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className="
                w-full
                max-w-4xl
                max-h-[85vh]
                overflow-hidden
                rounded-2xl
                bg-white
                dark:bg-gray-900
                shadow-2xl
                border border-gray-200 dark:border-gray-800
              "
            >
              {/* 🔹 Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Review Assistant
                  </Dialog.Title>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Completeness & consistency analysis of this report
                    (Reminder : AI can make mistakes, please review carefully)
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 🔹 Scrollable content */}
              <div className="overflow-y-auto px-6 py-5 max-h-[calc(85vh-72px)]">
                <ReportReviewAssistantPanel report={report} />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
