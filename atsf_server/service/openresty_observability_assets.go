package service

import "fmt"

const (
	openRestyObservabilityInitLuaPath = "init.lua"
	openRestyObservabilityLogLuaPath  = "log.lua"
	openRestyObservabilityReadLuaPath = "read.lua"
)

func renderOpenRestyObservabilityTemplateBlock() string {
	return stringsJoinLines(
		"    lua_shared_dict atsflare_observability 10m;",
		fmt.Sprintf("    init_worker_by_lua_file %s/%s;", nginxLuaDirPlaceholder, openRestyObservabilityInitLuaPath),
		fmt.Sprintf("    log_by_lua_file %s/%s;", nginxLuaDirPlaceholder, openRestyObservabilityLogLuaPath),
		"",
		fmt.Sprintf("    server {"),
		fmt.Sprintf("        listen %s;", nginxObservabilityListenPlaceholder),
		"        server_name atsflare-observability;",
		"        access_log off;",
		"",
		"        location = /atsflare/observability {",
		"            default_type application/json;",
		fmt.Sprintf("            content_by_lua_file %s/%s;", nginxLuaDirPlaceholder, openRestyObservabilityReadLuaPath),
		"        }",
		"",
		"        location = /atsflare/stub_status {",
		"            stub_status;",
		"        }",
		"    }",
		"",
	)
}

func stringsJoinLines(lines ...string) string {
	if len(lines) == 0 {
		return ""
	}
	result := ""
	for index, line := range lines {
		if index > 0 {
			result += "\n"
		}
		result += line
	}
	return result + "\n"
}
