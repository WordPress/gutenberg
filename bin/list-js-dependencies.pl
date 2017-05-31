#!/usr/bin/env perl

use warnings;
use strict;

use File::Basename;

chdir dirname dirname $0;

my $files = qx( git ls-files );
my %deps = ();

my $entry_points = 'blocks|components|date|editor|element|i18n|utils';

foreach my $file ( split /[\r\n]+/, $files ) {
	next if $file !~ /^($entry_points)\/.*\.js$/;
	my $entry_point = $1;

	open JSFILE, '<', $file or die;
	while ( <JSFILE> ) {
		if ( /from '($entry_points)[\/']/ ) {
			my $imported_entry = $1;
			if ( $entry_point ne $imported_entry ) {
				$deps{ $entry_point }{ $imported_entry } = 1;
			}
		}
	}
	close JSFILE or die;
}

foreach my $dest ( sort keys %deps ) {
	foreach my $source ( sort keys %{ $deps{ $dest } } ) {
		print "'$dest' depends on '$source'\n";
	}
}
print "\n";

my @loaded = ();

sub load_deps {
	my $entry_point = shift;
	my $stack = shift;
	my $loaded = shift;
	for my $ancestor ( @$stack ) {
		if ( $entry_point eq $ancestor ) {
			push @$stack, $entry_point;
			my $msg = join ' -> ', @$stack;
			die "Circular dependency: $msg\n";
		}
	}
	my @new_stack = @$stack;
	push @new_stack, $entry_point;
	unshift @loaded, \@new_stack;
	foreach my $dep ( reverse sort keys %{ $deps{ $entry_point } } ) {
		load_deps( $dep, \@new_stack );
	}
}

load_deps 'editor', [];

sub uniq {
	my %seen;
	return grep {
		my $seen_this = $seen{ $_ };
		$seen{ $_ } = 1;
		! $seen_this;
	} @_;
}

print "Suggested load order:\n\n";
foreach my $load ( uniq map { @$_[-1] } @loaded ) {
	print "$load\n";
}
