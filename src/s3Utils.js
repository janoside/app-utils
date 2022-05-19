const AWS = require('aws-sdk');

const debug = require("debug");
const debugLog = debug("app:s3Utils");

if (process.env.AWS_PROFILE_NAME) {
	debugLog(`Using AWS Credentials from profile '${process.env.AWS_PROFILE_NAME}'`);

	var credentials = new AWS.SharedIniFileCredentials({profile: process.env.AWS_PROFILE_NAME});
	AWS.config.credentials = credentials;
}

let s3Client = null;


const createBucket = (bucket, pathPrefix) => {
	if (s3Client == null) {
		debugLog(`Creating S3 Client with AWS Access Key: ${AWS.config.credentials.accessKeyId}`);
		
		s3Client = new AWS.S3({apiVersion: '2006-03-01'});
	}

	let prefix = (pathPrefix || "").trim();
	if (prefix.length > 0 && !prefix.endsWith("/")) {
		prefix = (prefix + "/");
	}

	return {
		put: async (data, path, options={}) => {
			let uploadParams = options || {};

			uploadParams.Bucket = bucket;
			uploadParams.Key = `${prefix}${path}`;
			uploadParams.Body = data;
				
			await s3Client.putObject(uploadParams).promise();
		},

		get: async (path) => {
			var getParams = {
				Bucket: bucket,
				Key: `${prefix}${path}`,
			};
			
			try {
				const s3Response = await s3Client.getObject(getParams).promise();

				return s3Response.Body;

			} catch (e) {
				if (e.code == "NoSuchKey") {
					return null;

				} else {
					throw e;
				}
			}
		},

		del: async (path) => {
			var deleteParams = {
				Bucket: bucket,
				Key: `${prefix}${path}`,
			};
				
			return await s3Client.deleteObject(deleteParams).promise();
		}
	};
};



module.exports = {
	createBucket: createBucket
};