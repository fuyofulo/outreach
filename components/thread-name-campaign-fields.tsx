"use client";

import { useState } from "react";

import { CustomSelect } from "@/components/custom-select";
import { Field } from "@/components/ui";

type CampaignOption = {
  id: string;
  name: string;
};

export function ThreadNameCampaignFields({
  campaigns,
}: {
  campaigns: CampaignOption[];
}) {
  const [title, setTitle] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  return (
    <>
      <Field label="Thread name">
        <input
          className="field"
          name="title"
          placeholder="Job outreach / feedback request / follow-up"
          required
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleTouched(true);
          }}
        />
      </Field>

      <Field label="Campaign">
        <CustomSelect
          name="campaignId"
          value={campaignId}
          onValueChange={(nextCampaignId) => {
            const nextCampaign = campaigns.find((campaign) => campaign.id === nextCampaignId);
            const previousCampaign = campaigns.find((campaign) => campaign.id === campaignId);

            if (!titleTouched || title === previousCampaign?.name || !title) {
              setTitle(nextCampaign?.name ?? "");
            }

            setCampaignId(nextCampaignId);
          }}
          options={[
            { value: "", label: "None" },
            ...campaigns.map((campaign) => ({
              value: campaign.id,
              label: campaign.name,
            })),
          ]}
          placeholder="None"
        />
      </Field>
    </>
  );
}
