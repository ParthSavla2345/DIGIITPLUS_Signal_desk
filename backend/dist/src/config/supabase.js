"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
// Use service role key for backend — full database access
exports.supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SECRET_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
//# sourceMappingURL=supabase.js.map