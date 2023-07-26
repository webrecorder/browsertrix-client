const fs = require("fs");
const { Readable } = require("node:stream");

class APIClient
{
  static async login(url, username, password) {
    const loginUrl = url + "/api/auth/jwt/login";

    const form = new FormData();
    form.append("username", username);
    form.append("password", password);

    const res = await fetch(loginUrl, {method: "POST", body: form});
    const auth = await res.json();
    const {token_type, access_token} = auth;

    const authToken = token_type + " " + access_token;
    return new APIClient(url, authToken);
  }

  constructor(url, auth) {
    this.url = url;
    this.auth = auth;
  }

  async fetchAPI(endpoint, method="GET", body=null) {
    const headers = {"Authorization": this.auth, "Content-Type": "application/json"};
    const resp = await fetch(this.url + endpoint, {headers, method, body, duplex: "half"});
    return await resp.json();
  }

  async getOrg(name="") {
    const json = await this.fetchAPI("/api/users/me-with-orgs");
    const { orgs } = json;
    if (!orgs || !orgs.length) {
      return null;
    }
    if (!name) {
      return orgs[0].id;
    }
    for (const org of orgs) {
      if (org.name === name) {
        return org.id;
      }
    }
    return orgs[0].id;
  }

	async getCrawlerWorkflows(org) {
		const res = await this.fetchAPI(`/api/${org}/crawlconfigs`)
		return res;
	}

	async getCrawlerWorkflow(org, cid="") {
		const res = await this.fetchAPI(`/api/${org}/crawlconfigs/${cid}`)
		return res;
	}

	async updateCrawlerWorkflow(org, cid="", config) {
		if (cid && config) {
			const res = await this.fetchAPI(`/api/${org}/crawlconfigs/${cid}`, method="PATCH", body=config)
			return res;
		}
		console.log("You must provide a Crawler ID and a Crawler Workflow to update")
	}

	async deleteCrawlerWorkflow(org, cid="") {
		if (cid) {
			const res = await this.fetchAPI(`/api/${org}/crawlconfigs/${cid}`, method="DELETE")
			return res;
		}
		console.log("You must provide a Crawler ID")
	}

	async addCrawlerWorkflow(org, config) {
		if (config) {
			const res = await this.fetchAPI(`/api/${org}/crawlconfigs/`, method="POST", body=config)
			return res;
		}
		console.log("You must provide a Crawler Workflow")
	}

	async runCrawl(org, cid="") {
		if (cid) {
			const res = await this.fetchAPI(`/api/${org}/crawlconfigs/${cid}/run`, method="POST")
			return res;
		}
		console.log("You must provide a Crawler ID")
	}

  async upload(org, data) {
    const res = await this.fetchAPI(`/api/orgs/${org}/uploads/stream?name=` + process.argv[2], "PUT", data);
    return res;
  }
}
