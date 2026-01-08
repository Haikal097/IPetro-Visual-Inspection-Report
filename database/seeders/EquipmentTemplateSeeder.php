<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EquipmentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Safety check
        if (!Schema::hasTable('equipment_templates')) {
            $this->command?->warn("Table equipment_templates not found. Skipping EquipmentTemplateSeeder.");
            return;
        }

        $now = now();

        // ✅ Match your DB columns exactly:
        // equipment_type, title, initial_finding, external_finding, internal_finding, ndt, recommendations, user_id, is_global
        $templates = [
            [
                'equipment_type' => 'Plant Air Receiver Vessel',
                'title' => 'V-001 - Plant Air Receiver Vessel (Standard)',
                'initial_finding' => 'Initial/Pre-Inspection - Not applicable',
                'external_finding' => implode("\n", [
                    "1.1 In general, equipment was found fully coated. All associate parts was noted on its position and in satisfactory condition.",
                    "1.2 Nameplate, equipment number and PMT number were found securely intact in its place and legible.",
                    "1.3 Concrete foundation, anchor bolts and support legs were observed in satisfactory condition with no sign of abnormalities.",
                    "1.4 View of bottom and top dish head was found in satisfactory condition. No sign of abnormalities observed.",
                    "1.5 View of shell externally observed in satisfactory condition with no sign of abnormalities or permanent physical appearance found. External coating noted intact properly on equipment surface.",
                    "1.6 All attachment nozzles, pressure gauge and lifting lug were observed in serviceable condition. No sign of anomaly seen.",
                ]),
                'internal_finding' => implode("\n", [
                    "2.1 Internal of manhole cover noted with evidence of mechanical mark on gasket seat area at 4 o’clock position. Result is acceptable as per ASME PCC1, Table D-2M.",
                    "2.2 Manhole flange was found in serviceable condition except for evidence of dented on gasket seat area at position 1 o’clock with approx. 3mm of maximum of radial projection.",
                    "2.3 Manhole weldment was found in serviceable condition except for evidence of pitting at 3 o’clock position.",
                    "2.4 Internal view of bottom and top dish head was observed in satisfactory condition with no sign of abnormalities.",
                    "2.5 View of bottom internal shell wall observed in good profile with no sign of relevant defect except for two locations with presence of mechanical mark and pitting on CW4.",
                    "2.6 All attachment nozzles internally observed in serviceable condition. No sign of anomaly observed.",
                ]),
                'ndt' => "UTTM: No significant wall lost detected compared to nominal thickness. Please refer attachment report.",
                'recommendations' => implode("\n", [
                    "2.3: To be monitored on next opportunity.",
                    "2.5: To be monitored on next opportunity.",
                ]),
            ],

            [
                'equipment_type' => 'Reactor',
                'title' => 'R-001 - Reactor (Standard)',
                'initial_finding' => 'Initial/Pre-Inspection - Not applicable',
                'external_finding' => implode("\n", [
                    "1.1 Generally, equipment was found fully insulated. Insulation found in serviceable condition with no sign of damage.",
                    "1.2 Nameplate, PMT number and equipment number found securely intact in its place and legible.",
                    "1.3 Concrete foundation and skirt were observed in satisfactory condition with no sign of anomaly.",
                    "1.4 Anchor bolts and earthing cable observed securely intact and in satisfactory condition.",
                    "1.5 Lifting lugs noted in serviceable condition.",
                    "1.6 Bottom dish head, shell and top dish head observed in good condition with no sign of damage on the insulation.",
                    "1.7 All non-insulated attachment nozzles were not noted in satisfactory condition except for its bolting systems were found with galvanic corrosion due to dissimilar material.",
                ]),
                'internal_finding' => implode("\n", [
                    "2.1 Internal shell found in satisfactory condition with no abnormalities. Baffle supports noted securely intact.",
                    "2.2 Bottom and top dish head observed in satisfactory condition.",
                    "2.3 All internal attachment and internal nozzles were found securely intact with no visible defect.",
                    "2.4 Nozzles N-2 and N-15 flange included its gasket seat area found in satisfactory condition.",
                    "2.5 H-1 and M-1 flange and cover noted with no sign of anomaly. Gasket seat area was found free any significant damage.",
                    "2.6 Internal top dish head surface noted with discoloration.",
                ]),
                'ndt' => "UTTM: No significant wall loss detected compared to nominal thickness upon testing. Please refer UTTM report.",
                'recommendations' => "1.7: To perform surface preparation and apply protective coating or replace with fluorocarbon coated bolt and nuts.",
            ],

            [
                'equipment_type' => 'Nitrogen Vessel',
                'title' => 'V-002 - Nitrogen Vessel (Standard)',
                'initial_finding' => 'Initial/Pre-Inspection - Not applicable',
                'external_finding' => implode("\n", [
                    "1.1 Generally, equipment was found fully painted. All associate parts noted securely intact in its position.",
                    "1.2 Nameplate, PMT number and equipment number were found secured in its place and legible.",
                    "1.3 Concrete foundation, support legs and anchor bolts observed in satisfactory condition with no sign of abnormalities.",
                    "1.4 Bottom and top dish head noted in satisfactory condition. No significant abnormalities observed.",
                    "1.5 Equipment shell externally noted in satisfactory condition with external coating noted intact properly on all equipment surfaces.",
                    "1.6 Davit arm, man hole and its cover were noted in serviceable condition with no evidence of significant damage.",
                    "1.7 All attachment nozzles, pressure gauge and lifting lug observed in satisfactory condition. No sign of anomaly seen.",
                ]),
                'internal_finding' => implode("\n", [
                    "2.1 Manhole cover noted with evidence of scratch mark on gasket seat area at 7 o’clock position.",
                    "2.2 Manhole flange was found in serviceable condition except for evidence of mechanical mark on gasket seat area at position 1 o’clock with approx. 3mm of maximum of radial projection. No further defect propagation compared to previous report.",
                    "2.3 Evidence of mechanical mark with length approx. 40mm and <0.5mm depth on 6 o’clock and mechanical mark with length approx. 5mm and <0.5mm depth on 12 o’clock section of manhole neck.",
                    "2.4 Top and bottom dish head observed in satisfactory condition with no sign of deterioration (as seen via bottom head).",
                    "2.5 Bottom internal shell wall observed in satisfactory with no sign of anomaly. Internal seams observed in good profile except for two locations of cluster porosity noted at CW1 and LW1B. DPT was performed and found acceptable previously. No further defect propagation compared to previous report.",
                    "2.6 Middle internal shell wall observed in satisfactory with no sign of anomaly (where seen and accessible).",
                    "2.7 All attachment nozzles internally observed in serviceable condition. No sign of anomaly observed.",
                ]),
                'ndt' => "UTTM: No significant wall lost detected compared to nominal thickness. Please refer attachment report.",
                'recommendations' => implode("\n", [
                    "2.2: To be monitored on next opportunity.",
                    "2.5: To be monitored on next opportunity.",
                ]),
            ],
        ];

        // ✅ If your app supports global templates:
        // - is_global = 1
        // - user_id = null
        foreach ($templates as $t) {
            DB::table('equipment_templates')->updateOrInsert(
                ['title' => $t['title']], // unique key
                [
                    'user_id' => null,
                    'equipment_type' => $t['equipment_type'],
                    'title' => $t['title'],
                    'initial_finding' => $t['initial_finding'],
                    'external_finding' => $t['external_finding'],
                    'internal_finding' => $t['internal_finding'],
                    'ndt' => $t['ndt'],
                    'recommendations' => $t['recommendations'],
                    'is_global' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
