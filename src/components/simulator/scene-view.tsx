"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PhoneFrame } from "./phone-frame";
import { PhoneHomeSceneView } from "./phone-home-scene";
import { WhatsAppThread } from "./whatsapp-scene";
import { SmsThread } from "./sms-scene";
import { EmailThread } from "./email-scene";
import { BrowserSite } from "./browser-scene";
import { DialogSceneView } from "./dialog-scene";
import { DecisionPanel } from "./decision-panel";
import type { ScenarioScene } from "@/lib/scenario/types";

export function SceneView({
  scene,
  slug,
  onChoose,
  onAction,
  pending,
}: {
  scene: ScenarioScene;
  slug: string;
  onChoose: (choiceId: string) => void;
  onAction: (actionId: string) => void;
  pending: boolean;
}) {
  const simUrl = `waspadain.id/simulasi-${slug}`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={scene.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-4"
      >
        {scene.type === "phone-home" ? (
          <PhoneFrame simUrl={simUrl}>
            <PhoneHomeSceneView scene={scene} onAction={onAction} pending={pending} />
          </PhoneFrame>
        ) : null}

        {scene.type === "whatsapp" ? (
          <PhoneFrame simUrl={simUrl}>
            <WhatsAppThread scene={scene} />
          </PhoneFrame>
        ) : null}

        {scene.type === "sms" ? (
          <PhoneFrame simUrl={simUrl}>
            <SmsThread scene={scene} />
          </PhoneFrame>
        ) : null}

        {scene.type === "email" ? (
          <PhoneFrame simUrl={simUrl}>
            <EmailThread scene={scene} />
          </PhoneFrame>
        ) : null}

        {scene.type === "browser" ? (
          <PhoneFrame simUrl={simUrl}>
            <BrowserSite scene={scene} />
          </PhoneFrame>
        ) : null}

        {scene.type === "dialog" ? (
          <PhoneFrame simUrl={simUrl} showSimChrome>
            <DialogSceneView scene={scene} onChoose={onChoose} pending={pending} />
          </PhoneFrame>
        ) : null}

        {scene.type !== "dialog" && scene.decision ? (
          <DecisionPanel
            decision={scene.decision}
            onChoose={onChoose}
            pending={pending}
          />
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
