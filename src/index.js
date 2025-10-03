#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_child_process_1 = require("node:child_process");
var commander_1 = require("commander");
var ora_1 = require("ora");
commander_1.program
    .requiredOption("--branch <branch>", "Branch name for the draft PR")
    .parse(process.argv);
var options = commander_1.program.opts();
function runCommand(command) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    (0, node_child_process_1.exec)(command, function (error, stdout, stderr) {
                        if (error)
                            return reject(stderr || error.message);
                        resolve(stdout.trim());
                    });
                })];
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var aheadCountOutput, aheadCount, systemPrompt, spinner_1, aiProcess, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // Check inside git repo
                    return [4 /*yield*/, runCommand("git rev-parse --is-inside-work-tree")];
                case 1:
                    // Check inside git repo
                    _a.sent();
                    return [4 /*yield*/, runCommand("git rev-list --left-right --count ".concat(options.branch, "...HEAD"))];
                case 2:
                    aheadCountOutput = _a.sent();
                    aheadCount = Number(aheadCountOutput.split("\t")[1] || "0");
                    if (aheadCount === 0) {
                        console.error("No commits ahead of the ".concat(options.branch, " branch to create a PR."));
                        process.exit(1);
                    }
                    systemPrompt = "system: you are to make a draft pull request against the ".concat(options.branch, " branch. title should use conventional commit style, all smallcase. description should have no attribution. do not assign, label, or mention anyone. always create the pr as draft.");
                    spinner_1 = (0, ora_1.default)("Generating draft pull request description via AI...").start();
                    aiProcess = (0, node_child_process_1.spawn)("claude", [
                        "--verbose",
                        "--dangerously-skip-permissions",
                        "-p",
                        systemPrompt,
                    ]);
                    aiProcess.stdout.on("data", function (data) {
                        spinner_1.text = "AI output: ".concat(data.toString().trim());
                    });
                    aiProcess.on("close", function (code) {
                        spinner_1.stop();
                        if (code === 0) {
                            console.log("\nDraft PR generation complete.");
                        }
                        else {
                            console.error("AI process failed.");
                        }
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
main();
