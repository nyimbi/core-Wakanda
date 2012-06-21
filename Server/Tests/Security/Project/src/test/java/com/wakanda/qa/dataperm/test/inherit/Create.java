package com.wakanda.qa.dataperm.test.inherit;

import static org.junit.Assert.assertNotNull;

import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.auth.AUTH;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

import com.wakanda.qa.dataperm.test.extend.AbstractSecurityTestCase;
import com.wakanda.qa.security.Targets;

/**
 * @author ouissam.gouni@4d.com
 * 
 */
public class Create extends AbstractSecurityTestCase {

	@Override
	protected HttpHost getDefaultTarget() {
		return Targets.CREATE_INHERITED;
	}
	
	@Override
	protected RESTAction getRESTAction() {
		return RESTAction.CREATE;
	}

	@Override
	protected String getDataClassName() {
		return "CreateInherited";
	}

	@Override
	protected User getAllowedUser() {
		return new User("createInherited");
	}

	/**
	 * Check that "Create" action is not performed when the permission is
	 * inherited and the request is devoid of authentication elements (Session
	 * cookie or Autorization header).
	 * 
	 * @throws Exception
	 */
	@Test
	public void testCreateActionIsNotPerformedWhenPermissionInheritedAndRequestIsDevoidOfAuthInfos()
			throws Exception {
		// Execute request
		HttpResponse response = executeRequest();
		// Ensure proper release of system resources
		EntityUtils.consume(response.getEntity());
		// Should get 401 Unauthorized
		assertEqualsStatusCode(HttpStatus.SC_UNAUTHORIZED, response);
		// Should get the authentication challenge too
		Header challenge = response.getFirstHeader(AUTH.WWW_AUTH);
		assertNotNull(AUTH.WWW_AUTH + " header is missing", challenge);
	}

	/**
	 * Check that "Create" action is not performed when the permission is
	 * inherited and the user is not authenticated ie. does not exist.
	 * 
	 * @throws Exception
	 */
	@Test
	public void testCreateActionIsNotPerformedWhenPermissionInheritedAndUserNotAuthenticated()
			throws Exception {
		// Get the user that does not belong to solution directory
		User user = getNonAuthenticatedUser();
		// Execute request
		HttpResponse response = executeAuthenticatedRequest(user);
		// Ensure proper release of system resources
		EntityUtils.consume(response.getEntity());
		// Should get 401 Unauthorized
		assertEqualsStatusCode(HttpStatus.SC_UNAUTHORIZED, response);
	}

	/**
	 * Check that "Create" action is not performed when the permission is
	 * inherited and the user is authenticated but not allowed.
	 * 
	 * @throws Exception
	 */
	@Test
	public void testCreateActionIsNotPerformedWhenPermissionInheritedAndUserAuthenticatedButNotAllowed()
			throws Exception {
		// Get an authenticated but not allowed user
		User user = getAuthenticatedButNotAllowedUser();
		// Execute request
		HttpResponse response = executeAuthenticatedRequest(user);
		// Ensure proper release of system resources
		EntityUtils.consume(response.getEntity());
		// Should get 401 Unauthorized
		assertEqualsStatusCode(HttpStatus.SC_UNAUTHORIZED, response);
	}

	/**
	 * Check that "Create" action is performed when the permission is inherited
	 * and the user is authenticated and allowed.
	 * 
	 * @throws Exception
	 */
	@Test
	public void testCreateActionIsPerformedWhenPermissionInheritedAndUserAuthenticatedAndAllowed()
			throws Exception {
		// Get the user allowed
		User user = getAllowedUser();
		// Execute request
		HttpResponse response = executeAuthenticatedRequest(user);
		// Ensure proper release of system resources
		EntityUtils.consume(response.getEntity());
		// Should get 200 OK
		assertEqualsStatusCode(HttpStatus.SC_OK, response);
	}

}
