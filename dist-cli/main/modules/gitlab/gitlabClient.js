import axios from "axios";
import { err, ok } from "../../../shared/types/result.js";
const getClient = (hostUrl, token) => {
    const baseURL = `${hostUrl.replace(/\/$/, "")}/api/v4`;
    return axios.create({
        baseURL,
        headers: {
            "PRIVATE-TOKEN": token,
        },
        timeout: 15000,
    });
};
export const fetchOpenMrs = async (hostUrl, token, projectId) => {
    try {
        if (!token) {
            // Mock data for immediate preview/testing without valid token
            return ok([
                {
                    id: 101,
                    iid: 1,
                    projectId: Number(projectId) || 259257,
                    title: "#259257 [PRIVATE] [Accounts] [FIX] Correct City literals to display City/Town",
                    description: "Se corrige el literal de ciudad en el formulario de detalles de cliente.",
                    state: "opened",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: {
                        name: "Alex Developer",
                        username: "adeveloper",
                        avatarUrl: "",
                    },
                    pipelineStatus: "success",
                    hasConflicts: false,
                    webUrl: "https://gitlab.com/demo/repo/-/merge_requests/1",
                },
                {
                    id: 102,
                    iid: 2,
                    projectId: Number(projectId) || 259257,
                    title: "#261104 [PUBLIC] [Payments] [FEAT] Add beneficiary bank validation",
                    description: "Añade validación de cuenta bancaria beneficiaria.",
                    state: "opened",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: {
                        name: "Maria Tech",
                        username: "mtech",
                        avatarUrl: "",
                    },
                    pipelineStatus: "running",
                    hasConflicts: false,
                    webUrl: "https://gitlab.com/demo/repo/-/merge_requests/2",
                },
                {
                    id: 103,
                    iid: 3,
                    projectId: Number(projectId) || 259257,
                    title: "refactor payment mapper without task id", // Non-compliant title for testing!
                    description: "Refactorización del mapper de tipos.",
                    state: "opened",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: {
                        name: "Carlos Junior",
                        username: "cjunior",
                        avatarUrl: "",
                    },
                    pipelineStatus: "failed",
                    hasConflicts: true,
                    webUrl: "https://gitlab.com/demo/repo/-/merge_requests/3",
                },
            ]);
        }
        const client = getClient(hostUrl, token);
        const response = await client.get(`/projects/${encodeURIComponent(projectId)}/merge_requests`, {
            params: { state: "opened", with_head_pipeline: true },
        });
        const rawList = response.data || [];
        const mrs = await Promise.all(rawList.map(async (item) => {
            const mr = mapMr(item);
            if (mr.pipelineStatus === "none") {
                try {
                    const pipeRes = await client.get(`/projects/${encodeURIComponent(projectId)}/merge_requests/${item.iid}/pipelines`);
                    if (pipeRes.data && pipeRes.data.length > 0) {
                        mr.pipelineStatus = pipeRes.data[0].status;
                    }
                }
                catch {
                    // Silently ignore per-MR pipeline fallback fetch error
                }
            }
            return mr;
        }));
        return ok(mrs);
    }
    catch (e) {
        return err(`Error en GitLab API: ${e.response?.data?.message || e.message}`);
    }
};
const mapUser = (u) => ({
    name: u?.name || "Desconocido",
    username: u?.username || "unknown",
    avatarUrl: u?.avatar_url || "",
});
const mapMr = (item) => ({
    id: item.id,
    iid: item.iid,
    projectId: item.project_id,
    title: item.title,
    description: item.description || "",
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    author: mapUser(item.author),
    reviewers: Array.isArray(item.reviewers) ? item.reviewers.map(mapUser) : [],
    assignees: Array.isArray(item.assignees)
        ? item.assignees.map(mapUser)
        : item.assignee
            ? [mapUser(item.assignee)]
            : [],
    labels: Array.isArray(item.labels)
        ? item.labels.map((l) => (typeof l === "string" ? l : l.name || String(l)))
        : [],
    pipelineStatus: item.head_pipeline?.status || item.pipeline?.status || item.pipeline_status || "none",
    hasConflicts: Boolean(item.has_conflicts),
    webUrl: item.web_url,
});
export const fetchMrDetails = async (hostUrl, token, projectId, mrIid, mrTitleFallback) => {
    try {
        if (!token) {
            // Mock details
            const isCompliant = mrIid !== 3;
            const commits = isCompliant
                ? [
                    {
                        sha: "a1b2c3d4e5",
                        shortSha: "a1b2c3d",
                        message: "#259257 fix: correct city literals in customer details form",
                        authorName: "Alex Developer",
                        createdAt: new Date().toISOString(),
                    },
                    {
                        sha: "f6g7h8i9j0",
                        shortSha: "f6g7h8i",
                        message: "#259257 test: add coverage for customer details validation",
                        authorName: "Alex Developer",
                        createdAt: new Date().toISOString(),
                    },
                ]
                : [
                    {
                        sha: "9988776655",
                        shortSha: "9988776",
                        message: "bad commit message without task id", // Non-compliant commit
                        authorName: "Carlos Junior",
                        createdAt: new Date().toISOString(),
                    },
                ];
            const diffs = [
                {
                    oldPath: "src/modules/customer/components/CustomerForm.tsx",
                    newPath: "src/modules/customer/components/CustomerForm.tsx",
                    diff: `@@ -40,7 +40,7 @@\n- const cityLabel = "Ciudad";\n+ const cityLabel = t('customer.cityOrTown');`,
                    newFile: false,
                    renamedFile: false,
                    deletedFile: false,
                },
            ];
            return ok({
                mr: {
                    id: mrIid,
                    iid: mrIid,
                    projectId: Number(projectId) || 259257,
                    title: mrTitleFallback ||
                        "#259257 [PRIVATE] [Accounts] [FIX] Correct City literals to display City/Town",
                    description: "Descripción de prueba",
                    state: "opened",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    author: { name: "Dev Team", username: "devteam", avatarUrl: "" },
                    pipelineStatus: "success",
                    hasConflicts: false,
                    webUrl: "https://gitlab.com",
                },
                commits,
                diffs,
            });
        }
        const client = getClient(hostUrl, token);
        const [mrRes, commitsRes, changesRes] = await Promise.all([
            client.get(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}`, {
                params: { with_head_pipeline: true },
            }),
            client.get(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/commits`),
            client.get(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/changes`),
        ]);
        const item = mrRes.data;
        const mr = mapMr(item);
        if (mr.pipelineStatus === "none") {
            try {
                const pipeRes = await client.get(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/pipelines`);
                if (pipeRes.data && pipeRes.data.length > 0) {
                    mr.pipelineStatus = pipeRes.data[0].status;
                }
            }
            catch {
                // Silently ignore
            }
        }
        const commits = (commitsRes.data || []).map((c) => ({
            sha: c.id,
            shortSha: c.short_id,
            message: c.title || c.message || "",
            authorName: c.author_name || "Desconocido",
            createdAt: c.created_at,
        }));
        const diffs = (changesRes.data?.changes || []).map((d) => ({
            oldPath: d.old_path,
            newPath: d.new_path,
            diff: d.diff,
            newFile: Boolean(d.new_file),
            renamedFile: Boolean(d.renamed_file),
            deletedFile: Boolean(d.deleted_file),
        }));
        return ok({ mr, commits, diffs });
    }
    catch (e) {
        return err(`Error obteniendo detalles del MR #${mrIid}: ${e.response?.data?.message || e.message}`);
    }
};
export const approveMr = async (hostUrl, token, projectId, mrIid) => {
    try {
        if (!token)
            return ok(true); // Mock success
        const client = getClient(hostUrl, token);
        await client.post(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/approve`);
        return ok(true);
    }
    catch (e) {
        return err(`Error al aprobar el MR #${mrIid}: ${e.response?.data?.message || e.message}`);
    }
};
export const mergeMr = async (hostUrl, token, projectId, mrIid) => {
    try {
        if (!token)
            return ok(true); // Mock success
        const client = getClient(hostUrl, token);
        await client.put(`/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/merge`);
        return ok(true);
    }
    catch (e) {
        return err(`Error al realizar Merge en el MR #${mrIid}: ${e.response?.data?.message || e.message}`);
    }
};
