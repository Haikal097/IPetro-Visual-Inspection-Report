<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportsWithPhotoReportsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $baseUrl = rtrim(config('app.url'), '/');

        $photoFiles = [
            "1GwxvP3t5aOSu6548j2iGdRsunbhjPfIe9szBTpz.png",
            "2QBtWgpdEUqtRxQxhCNVBLwkwW6XuMgv8E9hU0GA.png",
            "3CqISkLQbTtXhUGauoYPak7QfWYKrcIPHJutFYBf.png",
            "3g0D8sONOBDz2zJ47pUFLXa2pjCtiE1xicE4GLM0.png",
            "47MTXovq5wJh5PYyAhFkM2ZWtNKR1Jzh21jkPItv.png",
            "4jhuUQlNc5qLqrGl4kw5VLmRTSzPn4rDmbqgHc2F.png",
            "4xkPzHz5RNuqhA5Ow6d6hRoE16oKIpnyGnM1TeoA.png",
            "5okXrjlAseUIxdqdYSfwPRW1XK0rDorXOo9di8Ej.png",
            "5OOswfgxbFeXjie8fkASFFQ8XPogKq7WyelEMsKX.png",
            "6dVCEuiwKJlpOtYAj3tHDl5vcBlDyssux2QzJWpW.png",
            "6LP1aUIjTVnmqwURKJMPQXLbG7jgyOUQYcXGKjrZ.png",
            "770YLw2WbkYfokgsrvp4sZJDNXs5DhT1HGTtzqmj.png",
            "7C71FaKgRmgoejjGpy1D25VN9wZRVssnAoOE5sHe.png",
            "8jnT75Gh8nFDeZ1wHTCSF3iz1D0kMHCsnpO2o4Ex.png",
            "9ZcbiR6liWDliDYvpVVTIzLmY78vTEN9Mr1kmux0.png",
            "A1854QkoGbALyv63rUKO9jbafpwuuuvvLUUnbzYc.png",
            "A8KJJ4tH60hVpeME9EzJmJ6eMMQjTpZWNxxBcNpF.png",
            "ADVoe5JrgTxhgXZXukk8Gxr5au0ZlmNGt3Qq3p1J.png",
            "AGkIMtEK8Qd0bsTeYWZmwqCmqogCXTwgjbajvODR.png",
            "BoNc22rt0Wh3FrSEaHHyvPzYlL4tkEP2Ut4NY3ay.png",
            "C1mifDbxfPCBsYBGFvLtXgoqOIVAUUyxq3ZtLdJS.png",
            "D3GQac4ncekExjTx4YzCZLwaaRKVoyYZDKrG1BFv.png",
            "dMHiXhB1TNmyyFR4rIA8JorLsia1ypSJbJLSuSqH.png",
            "EkHkOZnZejSG4tHBmsG6j6wMBQT8e9TU0CxOxB0K.png",
            "FQckPeBxJ48vaTkWVAbjktrzgbutOi3H4VqNOlIE.png",
            "HagJgnpSJ8YHeSYwLqJbzwsDE3Q1ZJUUxxoaw0CI.png",
            "HVxobSzsvpJsVEdzOlwukB0PH5y9U8y70FVsYdrt.png",
            "jPpHqc1IJEsxcVGCzYu8lLo4EFCFYEn0Iw0yqzB8.png",
            "K5sQOkS4fT1DFRalRDvxF5Ct7r8VoXqkNocTRPM7.png",
            "NH9v2QZvcwisY0G1hCY6Dw1mKSb4qHaHQ60mCdCH.png",
            "RaNgriP5CjCaQn7ts0D3cXjyrKUUCt0okoPrDYOP.png",
            "rCWGg8rjki7Tm7X5tdE8VviW9GgpT9eZxzQFCimz.png",
            "rL4X5rQAxCQNaewtwn41DXwFO005RFkcaxyF2A20.png",
            "SdlxFciFqoH0JaLeWIIVuTjDhNiJRxqOqwe9y2nw.png",
            "VU0OKKVBkisHrKm8gwqJDYIvnHb1RvwSdueGNY73.png",
            "Vxi6JDySaLq6kSyZJ2xq4SR2JtkP38vvSLgHjK6M.png",
            "WnT9TOW1zVS8pSHLKmu97WMKa0oOsMiAJJfsHzAA.png",
            "zGqudGbHaC66jUbM3fXPGYy4nTUdzUYaIrKMLU3i.png",
        ];

        $equipmentTypes = [
            ["tag" => "V-001", "type" => "Plant Air Receiver Vessel", "desc" => "V-001 - Plant Air Receiver Vessel (Standard)"],
            ["tag" => "V-002", "type" => "Nitrogen Vessel", "desc" => "V-002 - Nitrogen Vessel (Standard)"],
            ["tag" => "V-003", "type" => "Receiver Vessel", "desc" => "V-003 - Receiver Vessel (Standard)"],
            ["tag" => "V-004", "type" => "Pressure Vessel", "desc" => "V-004 - Pressure Vessel (Standard)"],
            ["tag" => "V-005", "type" => "Surge Vessel", "desc" => "V-005 - Surge Vessel (Standard)"],
        ];

        $statuses = ["draft", "submitted", "in_review", "approved", "rejected"];

        // Candidate item templates (random pick)
        $itemTemplates = [
            ["title" => "Site",  "findings" => "Nil.", "requirements" => "Nil."],
            ["title" => "Label", "findings" => "View of equipment after cleaning.", "requirements" => "Visual Inspection."],
            ["title" => "Tag",   "findings" => "Nil.", "requirements" => "Nil."],
            ["title" => "Nozzle", "findings" => "No significant abnormalities observed.", "requirements" => "Visual Inspection."],
            ["title" => "Shell", "findings" => "Coating condition acceptable.", "requirements" => "Monitor for further degradation."],
            ["title" => "Nameplate", "findings" => "Nameplate legible and intact.", "requirements" => "Nil."],
        ];

        $last = DB::table('photo_reports')
            ->select(DB::raw("MAX(CAST(SUBSTRING(report_number, 5) AS UNSIGNED)) as max_no"))
            ->value('max_no');

        $reportNoStart = $last ? $last + 1 : 1001;

        DB::transaction(function () use (
            $now, $baseUrl, $photoFiles, $equipmentTypes, $statuses, $itemTemplates, $reportNoStart
        ) {
            
            $templateIds = DB::table('equipment_templates')->pluck('id')->all();
            for ($i = 0; $i < 50; $i++) {
                $equip = $equipmentTypes[array_rand($equipmentTypes)];
                $status = $statuses[array_rand($statuses)];

                $reportNo = "RPT-" . ($reportNoStart + $i);

                $day = rand(1, 31);
                $reportDate = Carbon::create(2026, 1, $day)->format('Y-m-d');

                $title = "{$equip['type']} - {$equip['tag']} - Jan 2026 Inspection";

                $tplId = $templateIds[array_rand($templateIds)];

                $jsonData = [
                    "title" => $title,
                    "equipmentTag" => $equip["tag"],
                    "equipmentDescription" => $equip["desc"],
                    "equipmentType" => $equip["type"],
                    "plantUnitArea" => "Plant Site",
                    "doshRegistration" => "D-" . rand(100, 999),
                    "reportNo" => $reportNo,
                    "reportDate" => $reportDate,
                    "initialFinding" => "Initial/Pre-Inspection - Not applicable",
                    "externalFinding" => "1.1 Generally, equipment was found fully painted.\n1.2 Nameplate and PMT number were intact and legible.",
                    "internalFinding" => "2.1 Internal condition observed satisfactory.\n2.2 Minor marks to be monitored on next opportunity.",
                    "ndt" => "UTTM: No significant wall loss detected compared to nominal thickness.",
                    "recommendations" => "To be monitored on next opportunity.",
                    "inspectorName" => "Afiq Haikal",
                    "publishDate" => $reportDate,
                    "equipmentTemplateId" => $tplId,
                ];

                // reports insert (PK is report_id)
                $reportId = DB::table('reports')->insertGetId([
                    "title" => $title,
                    "creator_id" => 2,
                    "reviewer_id" => null,
                    "status" => $status,
                    "creation_date" => Carbon::createFromFormat('Y-m-d', $reportDate)->setTime(rand(8, 20), rand(0, 59), rand(0, 59)),
                    "submission_date" => in_array($status, ["submitted", "approved", "rejected"], true)
                        ? Carbon::createFromFormat('Y-m-d', $reportDate)->setTime(rand(8, 20), rand(0, 59), rand(0, 59))
                        : null,
                    "json_data" => json_encode($jsonData, JSON_UNESCAPED_SLASHES),
                    "created_at" => $now,
                    "updated_at" => $now,
                    "inspector_id" => null,
                    "signed_at" => null,
                    "signed_ip" => null,
                    "signed_user_agent" => null,
                    "signature_sha256" => null,
                    "pdf_snapshot_path" => null,
                    "pdf_sha256" => null,
                    "verification_token" => null,
                    "equipment_template_id" => $tplId,
                ], 'report_id');

                // ✅ Random number of items: 1..6
                $count = rand(1, 6);

                // pick random unique templates (if count > templates, allow repeats)
                $items = [];
                for ($k = 1; $k <= $count; $k++) {
                    $tpl = $itemTemplates[array_rand($itemTemplates)];
                    $img = "/storage/photos/" . $photoFiles[array_rand($photoFiles)];

                    $items[] = [
                        "id" => $k,
                        "title" => $tpl["title"],
                        "findings" => $tpl["findings"],
                        "requirements" => $tpl["requirements"],
                        "image" => $img,
                    ];
                }

                $photoReportData = [
                    "reportTitle" => "VISUAL INTERNAL INSPECTION",
                    "reportNumber" => $reportNo,
                    "inspectionDate" => $reportDate,
                    "pmt" => "M-" . str_pad((string)rand(1, 99), 3, "0", STR_PAD_LEFT),
                    "tag" => "#" . rand(1, 99),
                    "description" => substr($equip["desc"], 0, 60),
                    "plantUnit" => "Plant-" . rand(1, 5),
                    "items" => $items,
                ];

                DB::table('photo_reports')->insert([
                    "report_id" => $reportId,
                    "report_title" => "VISUAL INTERNAL INSPECTION",
                    "report_number" => $reportNo,
                    "inspection_date" => $reportDate,
                    "pmt" => $photoReportData["pmt"],
                    "tag" => $photoReportData["tag"],
                    "description" => $photoReportData["description"],
                    "plant_unit" => $photoReportData["plantUnit"],
                    "report_data" => json_encode($photoReportData, JSON_UNESCAPED_SLASHES),
                    "created_at" => $now,
                    "updated_at" => $now,
                    "deleted_at" => null,
                ]);
            }
        });
    }
}
