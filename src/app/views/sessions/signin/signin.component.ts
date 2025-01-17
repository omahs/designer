/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AppService } from 'app/core/services/app.service';
import { AuthService } from 'app/core/services/auth.service';
import { SnackBar } from 'app/services/snack-bar.service';

@Component( {
	selector: 'app-signin',
	templateUrl: './signin.component.html',
	styleUrls: [ './signin.component.css' ]
} )
export class SigninComponent implements OnInit {

	@ViewChild( MatProgressBar ) progressBar: MatProgressBar;
	@ViewChild( MatButton ) submitButton: MatButton;

	form: FormGroup;

	constructor (
		private authService: AuthService,
		private router: Router
	) {
	}

	get email (): FormControl {
		return this.form?.get( 'email' ) as FormControl;
	}

	get password (): FormControl {
		return this.form?.get( 'password' ) as FormControl;
	}

	ngOnInit () {

		this.authService.logout();

		this.form = new FormGroup( {
			email: new FormControl( '', [ Validators.required, Validators.email ] ),
			password: new FormControl( '', Validators.required ),
			rememberMe: new FormControl( false )
		} );

	}

	onSubmit () {

		const formData = this.form.value;

		this.submitButton.disabled = true;

		this.progressBar.mode = 'indeterminate';

		this.authService
			.login( formData.email, formData.password )
			.subscribe( res => this.onSuccess( res ), err => this.onError( err ) );
	}

	onError ( error: any ) {

		this.submitButton.disabled = false;
		this.progressBar.mode = 'determinate';

		let message = 'some error occured';

		if ( error != null && error.message != null ) message = error.message;

		SnackBar.error( message );

	}

	onSuccess ( response: any ) {

		this.submitButton.disabled = false;
		this.progressBar.mode = 'determinate';

		SnackBar.show( 'Successfully signed in' );

		this.router.navigateByUrl( AppService.homeUrl );

	}
}
